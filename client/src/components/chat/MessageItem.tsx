import React, { useState } from 'react';
import {
  Smile,
  Reply,
  Pin,
  Copy,
  Forward,
  Edit2,
  Trash2,
  Check,
  Eye,
  Clock,
  Download,
  FileText,
  PinOff,
  MoreHorizontal,
  Link2,
  Bookmark,
  Info,
  AtSign,
} from 'lucide-react';
import { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { EmojiPicker } from '../pickers/EmojiPicker';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { MessageInfoModal } from '../modals/MessageInfoModal';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isSameSenderAsPrev?: boolean;
  searchQuery?: string;
  isActiveMatch?: boolean;
}

// 4 main reactions matching Teams
const primaryEmojis = ['👍', '❤️', '😆', '😮'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSameSenderAsPrev = false,
  searchQuery,
  isActiveMatch = false,
}) => {
  const { user } = useAuth();
  const {
    activeConversation,
    toggleReaction,
    togglePin,
    setReplyingTo,
    setEditingMessage,
    setForwardingMessage,
    deleteMessage,
  } = useChat();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageInfo, setShowMessageInfo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isSender =
    message.senderId?._id === user?._id ||
    (typeof message.senderId === 'string' && message.senderId === user?._id);

  const isGroup = activeConversation?.type === 'group';
  const isGroupAdmin =
    isGroup &&
    activeConversation?.admins?.some((a) => a._id === user?._id);

  // Check if message has @mentions
  const hasMention =
    Boolean(message.content && /@[a-zA-Z0-9_\s]+/i.test(message.content));

  // Check if current user is directly mentioned
  const mentionsMe =
    Boolean(user?.displayName && message.content?.toLowerCase().includes(`@${user.displayName.toLowerCase()}`)) ||
    Boolean(user?.username && message.content?.toLowerCase().includes(`@${user.username.toLowerCase()}`));

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce(
    (acc, curr) => {
      acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const userReactions = (message.reactions || []).filter((r) => {
    const rUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;
    return rUserId === user?._id;
  }).map((r) => r.emoji);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMessage(message._id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to highlight matching text in search
  const highlightSearchText = (text: string, query?: string, baseKey?: number | string) => {
    if (!query || !query.trim() || !text) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const segments = text.split(regex);

    if (segments.length === 1) return text;

    return (
      <React.Fragment key={baseKey}>
        {segments.map((segment, sIdx) => {
          if (!segment) return null;
          if (segment.toLowerCase() === query.trim().toLowerCase()) {
            return (
              <mark
                key={sIdx}
                className="bg-amber-300 dark:bg-amber-400 text-gray-950 px-1 py-0.2 rounded font-semibold shadow-2xs"
              >
                {segment}
              </mark>
            );
          }
          return segment;
        })}
      </React.Fragment>
    );
  };

  // Helper to autolink URLs, format mentions cleanly, and highlight search query
  const renderContentWithLinksAndMentions = (content: string, sentByMe: boolean) => {
    if (!content) return null;

    // Collect names of conversation members to match multi-word names (e.g. "Sneh Moradia")
    const memberNames: string[] = [];
    if (activeConversation?.members) {
      activeConversation.members.forEach((m) => {
        if (m.displayName) memberNames.push(m.displayName.trim());
        if (m.username) memberNames.push(m.username.trim());
      });
    }
    if (user?.displayName) memberNames.push(user.displayName.trim());
    if (user?.username) memberNames.push(user.username.trim());

    // Sort by length descending so "Sneh Moradia" is evaluated before "Sneh"
    const uniqueNames = Array.from(new Set(memberNames))
      .filter((n) => n.length > 0)
      .sort((a, b) => b.length - a.length);

    // Escape regex characters in names
    const escapedNames = uniqueNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // Match exact member name with @ OR single word mention @handle
    const mentionPattern = escapedNames.length > 0
      ? `@(?:${escapedNames.join('|')}|[a-zA-Z0-9_-]+)`
      : `@[a-zA-Z0-9_-]+`;

    // Combined regex for URLs and exact @mentions
    const tokenRegex = new RegExp(`(https?:\\/\\/[^\\s]+|${mentionPattern})`, 'gi');
    const parts = content.split(tokenRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      // Check if URL
      if (part.match(/^https?:\/\//i)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`underline font-medium hover:opacity-85 break-all transition-opacity ${
              sentByMe
                ? 'text-white underline decoration-white/70'
                : 'text-teams-600 dark:text-teams-400 underline decoration-teams-500/60'
            }`}
          >
            {part}
          </a>
        );
      }

      // Check if @mention
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold text-xs select-none transition-colors shadow-2xs ${
              sentByMe
                ? 'bg-white/25 hover:bg-white/35 text-white'
                : 'bg-teams-100/90 dark:bg-teams-900/60 text-teams-700 dark:text-teams-200 hover:bg-teams-200 dark:hover:bg-teams-900/90'
            }`}
          >
            {part}
          </span>
        );
      }

      // Normal text with search highlighting
      return highlightSearchText(part, searchQuery, i);
    });
  };

  // Circular delivery / read receipt status matching Teams reference (Image 1)
  const renderDeliveryStatus = () => {
    if (!isSender || message.isDeleted) return null;

    const readCount = (message.readBy || []).filter((r) => {
      const rId = typeof r.userId === 'object' ? r.userId._id : r.userId;
      return rId !== user?._id;
    }).length;

    if (readCount > 0) {
      return (
        <span
          title="Seen"
          className="w-4 h-4 rounded-full border border-teams-400 dark:border-teams-400 flex items-center justify-center text-teams-500 dark:text-teams-400 select-none cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setShowMessageInfo(true)}
        >
          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
        </span>
      );
    }

    const deliveredCount = (message.deliveredTo || []).filter((d) => {
      const dId = typeof d.userId === 'object' ? d.userId._id : d.userId;
      return dId !== user?._id;
    }).length;

    if (deliveredCount > 0) {
      return (
        <span
          title="Delivered"
          className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center text-gray-400 select-none cursor-pointer hover:scale-110 transition-transform"
          onClick={() => setShowMessageInfo(true)}
        >
          <Check className="w-2.5 h-2.5 stroke-[2]" />
        </span>
      );
    }

    return (
      <span title="Sending" className="text-gray-400 flex items-center">
        <Clock className="w-3.5 h-3.5" />
      </span>
    );
  };

  // Modern Teams Action Toolbar with Context Dropdown Menu matching Image 1
  const renderActionToolbar = (alignmentClass: string) => {
    if (message.isDeleted) return null;

    return (
      <div
        className={`absolute -top-7 ${alignmentClass} opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-lg shadow-md flex items-center p-0.5 gap-0.5 z-30 select-none pointer-events-none group-hover:pointer-events-auto`}
      >
        {/* Quick Reactions: 👍 ❤️ 😆 😮 */}
        <div className="flex items-center gap-0.5 pr-1">
          {primaryEmojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggleReaction(message._id, e)}
              className="w-6 h-6 flex items-center justify-center text-sm rounded hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover hover:scale-125 transition-transform cursor-pointer"
              title={`React ${e}`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Emoji Picker Button 😃+ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowMoreMenu(false);
            }}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors cursor-pointer"
            title="More Reactions"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showEmojiPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="absolute right-0 top-7 z-50">
                <EmojiPicker
                  onSelectEmoji={(emoji) => {
                    toggleReaction(message._id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            </>
          )}
        </div>

        <div className="w-[1px] h-4 bg-gray-200 dark:border-teamsDark-border mx-0.5" />

        {/* Edit Button (if sender) */}
        {isSender && (
          <button
            type="button"
            onClick={() => setEditingMessage(message)}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors cursor-pointer"
            title="Edit message"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* More Actions Dropdown (...) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors cursor-pointer ${
              showMoreMenu ? 'bg-gray-100 dark:bg-teamsDark-cardHover text-gray-900 dark:text-gray-100' : ''
            }`}
            title="More options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMoreMenu(false)}
              />
              <div
                className={`absolute top-7 ${
                  isSender ? 'right-0' : 'left-0'
                } z-50 w-44 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-xl py-1 text-xs select-none animate-fade-in`}
              >
                {/* Reply */}
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(message);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>

                {/* Forward */}
                <button
                  type="button"
                  onClick={() => {
                    setForwardingMessage(message);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>

                {/* Copy link */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopy();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy link'}</span>
                </button>

                {/* Pin for everyone */}
                <button
                  type="button"
                  onClick={() => {
                    togglePin(message._id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  {message.isPinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-amber-500" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 rotate-45" />
                      <span>Pin for everyone</span>
                    </>
                  )}
                </button>

                {/* Mark as unread */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Mark as unread</span>
                </button>

                {/* Message info */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageInfo(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-teams-500" />
                  <span>Message info</span>
                </button>

                {/* Delete (if allowed) */}
                {(isSender || isGroupAdmin) && (
                  <div className="border-t border-gray-100 dark:border-teamsDark-border my-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Reactions render helper
  const renderReactions = (justifyClass: string) => {
    if (Object.keys(groupedReactions).length === 0) return null;

    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${justifyClass}`}>
        {Object.entries(groupedReactions).map(([emoji, count]) => {
          const userReacted = userReactions.includes(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggleReaction(message._id, emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors select-none cursor-pointer ${
                userReacted
                  ? 'bg-teams-100 dark:bg-teams-900/60 text-teams-700 dark:text-teams-300 border border-teams-400'
                  : 'bg-gray-100 dark:bg-teamsDark-card hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-teamsDark-border'
              }`}
            >
              <span>{emoji}</span>
              <span className="text-[10px] font-semibold">{count}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {isSender ? (
        /* ========================================================================= */
        /* OUTGOING MESSAGE (CURRENT USER) - PURPLE BUBBLE ALIGNED RIGHT             */
        /* ========================================================================= */
        <div
          className={`group relative flex flex-col items-end px-4 ${
            isSameSenderAsPrev ? 'py-0.5' : 'pt-2 pb-0.5'
          }`}
        >
          {/* Action Toolbar on Hover (matches Image 1) */}
          {renderActionToolbar('right-2')}

          {/* Pinned Accent Flag */}
          {message.isPinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mb-1 mr-1">
              <Pin className="w-2.5 h-2.5 rotate-45 fill-current" />
              Pinned
            </span>
          )}

          {/* Outgoing Message Bubble Container */}
          <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div
                className={`relative px-4 py-2 text-sm leading-relaxed break-words shadow-xs transition-all duration-300 ${
                  isActiveMatch
                    ? 'ring-2 ring-amber-300 dark:ring-amber-300 ring-offset-2 dark:ring-offset-teamsDark-chat shadow-md '
                    : ''
                } ${
                  message.isDeleted
                    ? 'bg-gray-200 dark:bg-teamsDark-card text-gray-500 dark:text-gray-400 italic rounded-2xl rounded-tr-xs'
                    : 'bg-teams-500 text-white rounded-2xl ' +
                      (isSameSenderAsPrev ? 'rounded-tr-md' : 'rounded-tr-xs')
                }`}
              >
                {/* Quoted reply if present */}
                {message.replyTo && (
                  <div className="mb-1.5 p-2 rounded-lg bg-black/20 border-l-2 border-white text-xs text-white/90">
                    <span className="font-semibold block text-[11px] text-white">
                      {message.replyTo.senderId?.displayName || 'User'}
                    </span>
                    <p className="line-clamp-1 text-[11px] opacity-90">
                      {message.replyTo.content ||
                        (message.replyTo.gifUrl ? '[GIF]' : '[Attachment]')}
                    </p>
                  </div>
                )}

                {/* Deleted state */}
                {message.isDeleted ? (
                  <p className="flex items-center gap-1.5 py-0.5 text-xs">
                    <Trash2 className="w-3.5 h-3.5" />
                    This message was deleted
                  </p>
                ) : (
                  <>
                    {/* Text content with clickable URLs and highlighted @mentions */}
                    {message.content && (
                      <div className="whitespace-pre-wrap">
                        {renderContentWithLinksAndMentions(message.content, true)}
                      </div>
                    )}

                    {/* GIF Display */}
                    {message.gifUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden shadow-xs border border-white/20">
                        <img
                          src={message.gifUrl}
                          alt="Shared GIF"
                          className="w-full h-auto max-h-72 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* File / Image Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((att, idx) => {
                          const isImg = att.mimeType?.startsWith('image/');
                          if (isImg) {
                            return (
                              <div
                                key={idx}
                                onClick={() => setLightboxImage(att.url)}
                                className="rounded-xl overflow-hidden border border-white/20 cursor-pointer hover:opacity-95 transition-opacity"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="max-h-80 w-auto rounded-xl object-contain bg-black/10"
                                />
                              </div>
                            );
                          }

                          return (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              download={att.name}
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {att.name}
                                </p>
                                <p className="text-[10px] text-white/70">
                                  {formatFileSize(att.size)}
                                </p>
                              </div>
                              <Download className="w-3.5 h-3.5 text-white/80" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Circular checkmark delivery/seen receipt beside message bubble (matches Image 1) */}
              {renderDeliveryStatus()}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 mt-0.5 px-1 select-none">
              {message.isEdited && !message.isDeleted && (
                <span className="text-[10px] text-gray-400 italic">(edited)</span>
              )}
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
            </div>

            {/* Reaction Badges */}
            {renderReactions('justify-end')}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* INCOMING MESSAGE (OTHER USER) - AVATAR + BUBBLE ALIGNED LEFT              */
        /* ========================================================================= */
        <div
          className={`group relative flex items-start gap-2.5 px-4 ${
            isSameSenderAsPrev ? 'py-0.5' : 'pt-2 pb-0.5'
          }`}
        >
          {/* Action Toolbar on Hover (matches Image 1) */}
          {renderActionToolbar('left-12')}

          {/* Sender Avatar */}
          {!isSameSenderAsPrev ? (
            <Avatar
              name={message.senderId?.displayName || 'User'}
              imageUrl={message.senderId?.profilePicture}
              size="md"
              status={message.senderId?.status || 'available'}
              className="mt-0.5"
            />
          ) : (
            <div className="w-10 flex-shrink-0" />
          )}

          {/* Content Area */}
          <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-start min-w-0">
            {/* Sender Name & Tag Badge @ */}
            {!isSameSenderAsPrev && (
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`text-xs font-semibold ${
                    hasMention || mentionsMe
                      ? 'text-teams-700 dark:text-teams-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {message.senderId?.displayName || 'User'}
                </span>

                {/* Tag @ Badge icon matching Teams */}
                {(hasMention || mentionsMe) && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teams-100 dark:bg-teams-900/50 text-teams-600 dark:text-teams-300 text-[10px] font-bold select-none cursor-pointer"
                    title="Mentions team member"
                  >
                    @
                  </span>
                )}

                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                  {format(new Date(message.createdAt), 'h:mm a')}
                </span>
                {message.isEdited && !message.isDeleted && (
                  <span className="text-[10px] text-gray-400 italic">(edited)</span>
                )}
                {message.isPinned && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    <Pin className="w-2.5 h-2.5 rotate-45 fill-current" />
                    Pinned
                  </span>
                )}
              </div>
            )}

            {/* Received Message Bubble */}
            <div
              className={`relative px-4 py-2 text-sm leading-relaxed break-words shadow-xs border transition-all duration-300 ${
                isActiveMatch
                  ? 'ring-2 ring-teams-500 dark:ring-teams-400 ring-offset-2 dark:ring-offset-teamsDark-chat shadow-md '
                  : ''
              } ${
                message.isDeleted
                  ? 'bg-gray-100 dark:bg-teamsDark-card border-gray-200 dark:border-teamsDark-border text-gray-400 italic rounded-2xl rounded-tl-xs'
                  : 'bg-gray-100 dark:bg-teamsDark-card text-gray-900 dark:text-gray-100 border-gray-200/70 dark:border-teamsDark-border/60 rounded-2xl ' +
                    (isSameSenderAsPrev ? 'rounded-tl-md' : 'rounded-tl-xs')
              }`}
            >
              {/* Quoted reply */}
              {message.replyTo && (
                <div className="mb-1.5 p-2 rounded-lg bg-gray-200/60 dark:bg-teamsDark-input border-l-2 border-teams-500 text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-teams-600 dark:text-teams-400 block text-[11px]">
                    {message.replyTo.senderId?.displayName || 'User'}
                  </span>
                  <p className="line-clamp-1 text-[11px]">
                    {message.replyTo.content ||
                      (message.replyTo.gifUrl ? '[GIF]' : '[Attachment]')}
                  </p>
                </div>
              )}

              {/* Deleted state */}
              {message.isDeleted ? (
                <p className="flex items-center gap-1.5 py-0.5 text-xs">
                  <Trash2 className="w-3.5 h-3.5" />
                  This message was deleted
                </p>
              ) : (
                <>
                  {/* Text content with clickable URLs and highlighted @mentions */}
                  {message.content && (
                    <div className="whitespace-pre-wrap">
                      {renderContentWithLinksAndMentions(message.content, false)}
                    </div>
                  )}

                  {/* GIF Display */}
                  {message.gifUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden shadow-xs border border-gray-200 dark:border-teamsDark-border">
                      <img
                        src={message.gifUrl}
                        alt="Shared GIF"
                        className="w-full h-auto max-h-72 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* File / Image Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2 max-w-md">
                      {message.attachments.map((att, idx) => {
                        const isImg = att.mimeType?.startsWith('image/');
                        if (isImg) {
                          return (
                            <div
                              key={idx}
                              onClick={() => setLightboxImage(att.url)}
                              className="rounded-xl overflow-hidden border border-gray-200 dark:border-teamsDark-border cursor-pointer hover:opacity-95 transition-opacity"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="max-h-80 w-auto rounded-xl object-contain bg-black/5"
                              />
                            </div>
                          );
                        }

                        return (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            download={att.name}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-teamsDark-input border border-gray-200 dark:border-teamsDark-border hover:bg-gray-50 dark:hover:bg-teamsDark-cardHover transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-teams-100 dark:bg-teams-900/50 text-teams-600 dark:text-teams-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {att.name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatFileSize(att.size)}
                              </p>
                            </div>
                            <Download className="w-3.5 h-3.5 text-gray-400 hover:text-teams-500" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Consecutive message subtle timestamp */}
            {isSameSenderAsPrev && (
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 ml-1 select-none">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
            )}

            {/* Reaction Badges */}
            {renderReactions('justify-start')}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Message Info Modal (Read & Delivery Receipts) */}
      <MessageInfoModal
        isOpen={showMessageInfo}
        onClose={() => setShowMessageInfo(false)}
        message={message}
      />

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Enlarged preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
