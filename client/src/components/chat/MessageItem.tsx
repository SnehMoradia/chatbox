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
  CheckCheck,
  Eye,
  Clock,
  Download,
  FileText,
  PinOff,
} from 'lucide-react';
import { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { EmojiPicker } from '../pickers/EmojiPicker';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isSameSenderAsPrev?: boolean;
}

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSameSenderAsPrev = false,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  // Helper to autolink URLs in text
  const renderContentWithLinks = (content: string, sentByMe: boolean) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
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
      return part;
    });
  };

  // Render delivery & read receipt status for current user messages
  const renderDeliveryStatus = () => {
    if (!isSender || message.isDeleted) return null;

    const readCount = (message.readBy || []).filter((r) => {
      const rId = typeof r.userId === 'object' ? r.userId._id : r.userId;
      return rId !== user?._id;
    }).length;

    if (readCount > 0) {
      return (
        <span title="Seen" className="text-teams-500 dark:text-teams-400 flex items-center">
          <Eye className="w-3.5 h-3.5" />
        </span>
      );
    }

    const deliveredCount = (message.deliveredTo || []).filter((d) => {
      const dId = typeof d.userId === 'object' ? d.userId._id : d.userId;
      return dId !== user?._id;
    }).length;

    if (deliveredCount > 0) {
      return (
        <span title="Delivered" className="text-gray-400 flex items-center">
          <Check className="w-3.5 h-3.5" />
        </span>
      );
    }

    return (
      <span title="Sending" className="text-gray-400 flex items-center">
        <Clock className="w-3.5 h-3.5" />
      </span>
    );
  };

  // Action toolbar on hover
  const renderActionToolbar = (alignmentClass: string) => {
    if (message.isDeleted) return null;

    return (
      <div
        className={`absolute -top-7 ${alignmentClass} opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-lg shadow-md flex items-center p-0.5 gap-0.5 z-30 select-none pointer-events-none group-hover:pointer-events-auto`}
      >
        {/* Quick Reactions */}
        <div className="hidden sm:flex items-center gap-0.5 border-r border-gray-100 dark:border-teamsDark-border pr-1 mr-0.5">
          {quickEmojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => toggleReaction(message._id, e)}
              className="w-6 h-6 flex items-center justify-center text-xs rounded hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover hover:scale-125 transition-transform"
              title={`React ${e}`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* More Reactions / Emoji Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
            title="Add Reaction"
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

        {/* Reply */}
        <button
          type="button"
          onClick={() => setReplyingTo(message)}
          className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {/* Pin / Unpin */}
        <button
          type="button"
          onClick={() => togglePin(message._id)}
          className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
          title={message.isPinned ? 'Unpin' : 'Pin'}
        >
          {message.isPinned ? (
            <PinOff className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Pin className="w-3.5 h-3.5 rotate-45" />
          )}
        </button>

        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
          title={copied ? 'Copied!' : 'Copy text'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Forward */}
        <button
          type="button"
          onClick={() => setForwardingMessage(message)}
          className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
          title="Forward"
        >
          <Forward className="w-3.5 h-3.5" />
        </button>

        {/* Edit (only sender) */}
        {isSender && (
          <button
            type="button"
            onClick={() => setEditingMessage(message)}
            className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete (sender or group admin) */}
        {(isSender || isGroupAdmin) && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-1 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors select-none ${
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
          {/* Action Toolbar on Hover */}
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
            <div
              className={`relative px-4 py-2 text-sm leading-relaxed break-words shadow-xs transition-colors ${
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
                  {/* Text content with clickable URLs */}
                  {message.content && (
                    <div className="whitespace-pre-wrap">
                      {renderContentWithLinks(message.content, true)}
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

            {/* Status indicators & timestamp beside / beneath sent bubble */}
            <div className="flex items-center gap-1.5 mt-0.5 px-1 select-none">
              {message.isEdited && !message.isDeleted && (
                <span className="text-[10px] text-gray-400 italic">(edited)</span>
              )}
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
              {renderDeliveryStatus()}
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
          {/* Action Toolbar on Hover */}
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
            {/* Sender Name & Timestamp (only for first message in consecutive chain) */}
            {!isSameSenderAsPrev && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {message.senderId?.displayName || 'User'}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
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
              className={`relative px-4 py-2 text-sm leading-relaxed break-words shadow-xs border transition-colors ${
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
                  {/* Text content with clickable URLs */}
                  {message.content && (
                    <div className="whitespace-pre-wrap">
                      {renderContentWithLinks(message.content, false)}
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
