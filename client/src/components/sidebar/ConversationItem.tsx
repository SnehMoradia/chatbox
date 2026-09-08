import React from 'react';
import { Conversation, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { format, isToday, isYesterday } from 'date-fns';
import { Users } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  isTyping?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  isTyping,
}) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const isGroup = conversation.type === 'group';

  // For private chat, extract the other member
  const otherMember: User | undefined = !isGroup
    ? conversation.members.find((m) => m._id !== user?._id)
    : undefined;

  const displayName = isGroup
    ? conversation.name || 'Group Chat'
    : otherMember?.displayName || 'Chat';

  const avatarUrl = isGroup ? conversation.groupPicture : otherMember?.profilePicture;
  const isOnline = otherMember ? isUserOnline(otherMember._id) : false;

  // Format last message timestamp
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      }
      if (isYesterday(date)) {
        return 'Yesterday';
      }
      return format(date, 'MM/dd/yy');
    } catch {
      return '';
    }
  };

  // Preview snippet
  const renderLastMessageSnippet = () => {
    if (isTyping) {
      return (
        <span className="text-teams-500 dark:text-teams-400 font-medium italic animate-pulse">
          typing...
        </span>
      );
    }

    const msg = conversation.lastMessage;
    if (!msg) {
      return <span className="text-gray-400 italic">No messages yet</span>;
    }

    if (msg.isDeleted) {
      return <span className="italic text-gray-400">This message was deleted</span>;
    }

    const senderPrefix = isGroup && msg.senderId
      ? `${msg.senderId.displayName?.split(' ')[0] || 'Member'}: `
      : '';

    if (msg.gifUrl) {
      return <span>{senderPrefix}🎬 GIF</span>;
    }

    if (msg.attachments && msg.attachments.length > 0) {
      const isImg = msg.attachments[0].mimeType?.startsWith('image/');
      return <span>{senderPrefix}{isImg ? '📷 Photo' : '📎 File'}</span>;
    }

    return <span>{senderPrefix}{msg.content}</span>;
  };

  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all select-none ${
        isActive
          ? 'bg-white dark:bg-teamsDark-card text-gray-900 dark:text-gray-100 shadow-xs'
          : 'hover:bg-gray-200/60 dark:hover:bg-teamsDark-cardHover text-gray-700 dark:text-gray-300'
      }`}
    >
      {/* Active accent bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-teams-500 rounded-r" />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          name={displayName}
          imageUrl={avatarUrl}
          size="md"
          status={otherMember?.status}
          isOnline={!isGroup ? isOnline : undefined}
        />
        {isGroup && (
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white dark:bg-teamsDark-card text-gray-500 border border-gray-200 dark:border-teamsDark-border">
            <Users className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Info & Last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className={`text-xs truncate ${
              hasUnread
                ? 'font-bold text-gray-900 dark:text-white'
                : 'font-semibold text-gray-800 dark:text-gray-200'
            }`}
          >
            {displayName}
          </span>
          <span
            className={`text-[10px] flex-shrink-0 ${
              hasUnread
                ? 'text-teams-600 dark:text-teams-400 font-semibold'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              hasUnread
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {renderLastMessageSnippet()}
          </p>

          {hasUnread && (
            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-white bg-teams-500 rounded-full min-w-[1.2rem] text-center shadow-xs">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
