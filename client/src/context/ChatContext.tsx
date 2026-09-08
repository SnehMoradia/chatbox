import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Conversation, Message, User } from '../types';
import { conversationsApi, messagesApi } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { soundService } from '../utils/sound';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: { userId: string; username: string; displayName: string }[];
  isInfoPanelOpen: boolean;
  setIsInfoPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  forwardingMessage: Message | null;
  setForwardingMessage: (msg: Message | null) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (payload: {
    content?: string;
    attachments?: Array<{ url: string; name: string; size: number; mimeType: string }>;
    gifUrl?: string;
  }) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  forwardMessage: (messageId: string, targetIds: string[]) => Promise<void>;
  createGroup: (data: { name: string; description?: string; groupPicture?: string; members: string[] }) => Promise<Conversation>;
  getOrCreatePrivateChat: (recipientId: string) => Promise<Conversation>;
  updateGroupInfo: (conversationId: string, data: { name?: string; description?: string; groupPicture?: string }) => Promise<void>;
  addMembersToGroup: (conversationId: string, memberIds: string[]) => Promise<void>;
  removeMemberFromGroup: (conversationId: string, memberId: string) => Promise<void>;
  toggleAdminRole: (conversationId: string, memberId: string) => Promise<void>;
  leaveCurrentGroup: (conversationId: string) => Promise<void>;
  clearChat: (conversationId: string) => Promise<void>;
  sendTyping: () => void;
  sendStopTyping: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string; displayName: string }[]>([]);

  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const activeConvoRef = useRef<Conversation | null>(activeConversation);
  activeConvoRef.current = activeConversation;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await conversationsApi.getAll();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [isAuthenticated, fetchConversations]);

  // Select conversation & load its messages
  const selectConversation = async (conversation: Conversation) => {
    if (activeConversation?._id === conversation._id) {
      setIsMobileSidebarOpen(false);
      return;
    }

    // Leave old room
    if (socket && activeConversation) {
      socket.emit('leaveConversation', { conversationId: activeConversation._id });
    }

    setActiveConversation(conversation);
    setIsMobileSidebarOpen(false);
    setReplyingTo(null);
    setEditingMessage(null);
    setTypingUsers([]);
    setIsLoadingMessages(true);

    // Join new room
    if (socket) {
      socket.emit('joinConversation', { conversationId: conversation._id });
    }

    try {
      const data = await messagesApi.getByConversation(conversation._id);
      if (data.success) {
        setMessages(data.messages);

        // Mark conversation as read
        if (conversation.unreadCount && conversation.unreadCount > 0) {
          await messagesApi.markAsRead(conversation._id);
          setConversations((prev) =>
            prev.map((c) => (c._id === conversation._id ? { ...c, unreadCount: 0 } : c))
          );
          if (socket) {
            socket.emit('messageRead', {
              conversationId: conversation._id,
              messageIds: data.messages.map((m) => m._id),
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: Message) => {
      const current = activeConvoRef.current;
      const isCurrentConvo = current && current._id === msg.conversationId;

      if (isCurrentConvo) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark as read in real time if sender is someone else
        if (user && msg.senderId._id !== user._id) {
          messagesApi.markAsRead(msg.conversationId);
          socket.emit('messageRead', {
            conversationId: msg.conversationId,
            messageIds: [msg._id],
          });
          soundService.playNotification();
        }
      }

      // Update conversations list order and last message preview
      setConversations((prev) => {
        const found = prev.find((c) => c._id === msg.conversationId);
        if (!found) {
          fetchConversations();
          return prev;
        }

        const isUnread = !isCurrentConvo && user && msg.senderId._id !== user._id;
        const updated = {
          ...found,
          lastMessage: msg,
          updatedAt: msg.createdAt,
          unreadCount: isUnread ? (found.unreadCount || 0) + 1 : found.unreadCount || 0,
        };

        return [updated, ...prev.filter((c) => c._id !== msg.conversationId)];
      });
    };

    const handleNewMessageNotification = ({ conversationId, message }: { conversationId: string; message: Message }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) return;

      soundService.playNotification();

      setConversations((prev) => {
        const existing = prev.find((c) => c._id === conversationId);
        if (!existing) {
          fetchConversations();
          return prev;
        }
        const updated = {
          ...existing,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: (existing.unreadCount || 0) + 1,
        };
        return [updated, ...prev.filter((c) => c._id !== conversationId)];
      });
    };

    const handleTyping = ({ conversationId, userId, username, displayName }: {
      conversationId: string;
      userId: string;
      username: string;
      displayName: string;
    }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId && userId !== user?._id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, username, displayName }];
        });
      }
    };

    const handleStopTyping = ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }
    };

    const handleMessageRead = ({ conversationId, messageIds, userId, readAt }: {
      conversationId: string;
      messageIds: string[];
      userId: string;
      readAt: string;
    }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (!messageIds || messageIds.includes(msg._id)) {
              const already = msg.readBy?.some((r) =>
                (typeof r.userId === 'object' ? r.userId._id : r.userId) === userId
              );
              if (!already) {
                return {
                  ...msg,
                  readBy: [...(msg.readBy || []), { userId, readAt }],
                };
              }
            }
            return msg;
          })
        );
      }
    };

    const handleMessageEdited = ({ conversationId, message }: { conversationId: string; message: Message }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId && c.lastMessage?._id === message._id) {
            return { ...c, lastMessage: message };
          }
          return c;
        })
      );
    };

    const handleMessageDeleted = ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  isDeleted: true,
                  content: 'This message was deleted',
                  attachments: [],
                  gifUrl: null,
                  reactions: [],
                }
              : m
          )
        );
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId && c.lastMessage?._id === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                isDeleted: true,
                content: 'This message was deleted',
              } as Message,
            };
          }
          return c;
        })
      );
    };

    const handleMessageReaction = ({ conversationId, messageId, reactions }: {
      conversationId: string;
      messageId: string;
      reactions: Message['reactions'];
    }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
        );
      }
    };

    const handleMessagePinned = ({ conversationId, messageId, isPinned }: {
      conversationId: string;
      messageId: string;
      isPinned: boolean;
    }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
        );
        fetchConversations();
      }
    };

    const handleConversationUpdated = (updated: Conversation) => {
      setConversations((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      if (activeConvoRef.current?._id === updated._id) {
        setActiveConversation(updated);
      }
    };

    const handleChatCleared = ({ conversationId }: { conversationId: string }) => {
      const current = activeConvoRef.current;
      if (current && current._id === conversationId) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: undefined, pinnedMessages: [] }
            : c
        )
      );
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newMessageNotification', handleNewMessageNotification);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageReaction', handleMessageReaction);
    socket.on('messagePinned', handleMessagePinned);
    socket.on('conversationUpdated', handleConversationUpdated);
    socket.on('chatCleared', handleChatCleared);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newMessageNotification', handleNewMessageNotification);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageReaction', handleMessageReaction);
      socket.off('messagePinned', handleMessagePinned);
      socket.off('conversationUpdated', handleConversationUpdated);
      socket.off('chatCleared', handleChatCleared);
    };
  }, [socket, user, fetchConversations]);

  // Send message
  const sendMessage = async ({
    content,
    attachments,
    gifUrl,
  }: {
    content?: string;
    attachments?: Array<{ url: string; name: string; size: number; mimeType: string }>;
    gifUrl?: string;
  }) => {
    if (!activeConversation) return;

    sendStopTyping();

    const payload = {
      conversationId: activeConversation._id,
      content,
      attachments,
      gifUrl,
      replyTo: replyingTo?._id,
      messageType: (gifUrl ? 'gif' : attachments && attachments.length > 0 ? 'file' : 'text') as Message['messageType'],
    };

    try {
      const res = await messagesApi.sendMessage(payload);
      if (res.success && res.message) {
        setReplyingTo(null);
        if (socket) {
          socket.emit('sendMessage', res.message);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeConversation) return;
    try {
      const res = await messagesApi.editMessage(messageId, newContent);
      if (res.success && res.message) {
        setEditingMessage(null);
        if (socket) {
          socket.emit('messageEdited', {
            conversationId: activeConversation._id,
            message: res.message,
          });
        }
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!activeConversation) return;
    try {
      const res = await messagesApi.deleteMessage(messageId);
      if (res.success) {
        if (socket) {
          socket.emit('messageDeleted', {
            conversationId: activeConversation._id,
            messageId,
          });
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Clear all messages in conversation
  const clearChat = async (conversationId: string) => {
    try {
      await messagesApi.clearChat(conversationId);
      if (activeConversation?._id === conversationId) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: undefined, pinnedMessages: [] }
            : c
        )
      );
      if (socket) {
        socket.emit('clearChat', { conversationId });
      }
    } catch (err) {
      console.error('Failed to clear chat:', err);
      throw err;
    }
  };

  // Reaction toggle
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversation) return;
    try {
      const res = await messagesApi.toggleReaction(messageId, emoji);
      if (res.success && socket) {
        socket.emit('messageReaction', {
          conversationId: activeConversation._id,
          messageId,
          reactions: res.reactions,
        });
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  // Pin toggle
  const togglePin = async (messageId: string) => {
    if (!activeConversation) return;
    try {
      const res = await messagesApi.togglePin(messageId);
      if (res.success && socket) {
        socket.emit('messagePinned', {
          conversationId: activeConversation._id,
          messageId,
          isPinned: res.isPinned,
        });
      }
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  // Forward message
  const forwardMessage = async (messageId: string, targetIds: string[]) => {
    try {
      const res = await messagesApi.forwardMessage(messageId, targetIds);
      if (res.success && socket) {
        res.messages.forEach((msg) => {
          socket.emit('sendMessage', msg);
        });
        setForwardingMessage(null);
        await fetchConversations();
      }
    } catch (err) {
      console.error('Failed to forward message:', err);
    }
  };

  // Create group
  const createGroup = async (data: { name: string; description?: string; groupPicture?: string; members: string[] }) => {
    const res = await conversationsApi.createGroup(data);
    if (res.success && res.conversation) {
      setConversations((prev) => [res.conversation, ...prev]);
      await selectConversation(res.conversation);
      if (socket) {
        socket.emit('conversationUpdated', res.conversation);
      }
      return res.conversation;
    }
    throw new Error('Failed to create group');
  };

  // Get or create private chat
  const getOrCreatePrivateChat = async (recipientId: string) => {
    const res = await conversationsApi.getOrCreatePrivate(recipientId);
    if (res.success && res.conversation) {
      const exists = conversations.find((c) => c._id === res.conversation._id);
      if (!exists) {
        setConversations((prev) => [res.conversation, ...prev]);
      }
      await selectConversation(res.conversation);
      return res.conversation;
    }
    throw new Error('Failed to initiate private chat');
  };

  // Update group info
  const updateGroupInfo = async (conversationId: string, data: { name?: string; description?: string; groupPicture?: string }) => {
    const res = await conversationsApi.updateGroup(conversationId, data);
    if (res.success && res.conversation) {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? res.conversation : c)));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(res.conversation);
      }
      if (socket) {
        socket.emit('conversationUpdated', res.conversation);
      }
    }
  };

  // Add members
  const addMembersToGroup = async (conversationId: string, memberIds: string[]) => {
    const res = await conversationsApi.addMembers(conversationId, memberIds);
    if (res.success && res.conversation) {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? res.conversation : c)));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(res.conversation);
      }
      if (socket) {
        socket.emit('conversationUpdated', res.conversation);
      }
    }
  };

  // Remove member
  const removeMemberFromGroup = async (conversationId: string, memberId: string) => {
    const res = await conversationsApi.removeMember(conversationId, memberId);
    if (res.success && res.conversation) {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? res.conversation : c)));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(res.conversation);
      }
      if (socket) {
        socket.emit('conversationUpdated', res.conversation);
      }
    }
  };

  // Toggle admin
  const toggleAdminRole = async (conversationId: string, memberId: string) => {
    const res = await conversationsApi.toggleAdmin(conversationId, memberId);
    if (res.success && res.conversation) {
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? res.conversation : c)));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(res.conversation);
      }
      if (socket) {
        socket.emit('conversationUpdated', res.conversation);
      }
    }
  };

  // Leave group
  const leaveCurrentGroup = async (conversationId: string) => {
    const res = await conversationsApi.leaveGroup(conversationId);
    if (res.success) {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    }
  };

  // Typing events
  const sendTyping = () => {
    if (!socket || !activeConversation) return;
    socket.emit('typing', { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 3000);
  };

  const sendStopTyping = () => {
    if (!socket || !activeConversation) return;
    socket.emit('stopTyping', { conversationId: activeConversation._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        isInfoPanelOpen,
        setIsInfoPanelOpen,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        forwardingMessage,
        setForwardingMessage,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        fetchConversations,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePin,
        forwardMessage,
        createGroup,
        getOrCreatePrivateChat,
        updateGroupInfo,
        addMembersToGroup,
        removeMemberFromGroup,
        toggleAdminRole,
        leaveCurrentGroup,
        clearChat,
        sendTyping,
        sendStopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
