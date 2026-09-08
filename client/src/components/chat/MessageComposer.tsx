import React, { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Image as ImageIcon,
  Paperclip,
  Send,
  X,
  Loader2,
  Film,
  FileText,
  AtSign,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { EmojiPicker } from '../pickers/EmojiPicker';
import { GifPicker } from '../pickers/GifPicker';
import { Avatar } from '../common/Avatar';
import { uploadsApi } from '../../services/api';
import { Attachment, User } from '../../types';

export const MessageComposer: React.FC = () => {
  const { user } = useAuth();
  const {
    activeConversation,
    sendMessage,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    editMessage,
    sendTyping,
    sendStopTyping,
  } = useChat();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync editing message into composer input
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Adjust textarea height dynamically
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    adjustHeight();

    // Check for @mention trigger
    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]))) {
      const q = textBeforeCursor.slice(lastAtIdx + 1);
      if (!q.includes(' ') && !q.includes('\n')) {
        setMentionQuery(q);
        setShowMentionPopup(true);
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }

    if (val.trim()) {
      sendTyping();
    } else {
      sendStopTyping();
    }
  };

  const handleSelectMention = (member: User) => {
    const cursorPos = textareaRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    let newText = '';
    if (lastAtIdx !== -1) {
      newText = textBeforeCursor.slice(0, lastAtIdx) + `@${member.displayName} ` + textAfterCursor;
    } else {
      newText = text + `@${member.displayName} `;
    }

    setText(newText);
    setShowMentionPopup(false);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleTriggerMention = () => {
    setText((prev) => (prev.endsWith(' ') || prev === '' ? prev + '@' : prev + ' @'));
    setShowMentionPopup(true);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // If mention popup is open and enter is pressed without selecting, let user type or close popup
      if (showMentionPopup && mentionCandidates.length > 0) {
        e.preventDefault();
        handleSelectMention(mentionCandidates[0]);
        return;
      }

      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && showMentionPopup) {
      setShowMentionPopup(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;

    if (editingMessage) {
      await editMessage(editingMessage._id, text.trim());
      setEditingMessage(null);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    await sendMessage({
      content: text.trim(),
      attachments,
    });

    setText('');
    setAttachments([]);
    setShowMentionPopup(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendStopTyping();
  };

  const handleSendGif = async (gifUrl: string) => {
    setShowGifPicker(false);
    await sendMessage({
      gifUrl,
      content: text.trim() || undefined,
    });
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      if (files.length === 1) {
        const res = await uploadsApi.uploadSingle(files[0]);
        if (res.success) {
          setAttachments((prev) => [...prev, res.file]);
        }
      } else {
        const res = await uploadsApi.uploadMultiple(Array.from(files));
        if (res.success) {
          setAttachments((prev) => [...prev, ...res.files]);
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  if (!activeConversation) return null;

  // Filter mention candidates from active conversation members
  const rawMembers = activeConversation.members || [];
  const mentionCandidates = rawMembers
    .filter((m) => m._id !== user?._id)
    .filter((m) => {
      if (!mentionQuery) return true;
      const q = mentionQuery.toLowerCase();
      return (
        m.displayName?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-3 bg-white dark:bg-teamsDark-sidebar border-t border-gray-200/80 dark:border-teamsDark-border select-none flex-shrink-0">
      <div className="relative border border-gray-300 dark:border-teamsDark-border rounded-xl bg-gray-50 dark:bg-teamsDark-input shadow-xs focus-within:border-teams-500 focus-within:ring-1 focus-within:ring-teams-500 transition-all">
        {/* @Mention Autocomplete Popup */}
        {showMentionPopup && mentionCandidates.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMentionPopup(false)}
            />
            <div className="absolute bottom-full mb-2 left-2 z-50 w-64 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-xl overflow-hidden py-1 animate-fade-in select-none">
              <div className="px-3 py-1 text-[10px] font-semibold text-teams-600 dark:text-teams-400 uppercase tracking-wider border-b border-gray-100 dark:border-teamsDark-border flex items-center gap-1">
                <AtSign className="w-3 h-3" />
                Mention Teammate
              </div>
              <div className="max-h-48 overflow-y-auto teams-scrollbar">
                {mentionCandidates.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => handleSelectMention(m)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors cursor-pointer"
                  >
                    <Avatar name={m.displayName} imageUrl={m.profilePicture} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {m.displayName}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        @{m.username}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Replying Banner Preview */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-teamsDark-card border-b border-gray-200 dark:border-teamsDark-border rounded-t-xl text-xs">
            <div className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-teams-600 dark:text-teams-400">
                Replying to {replyingTo.senderId?.displayName}:
              </span>
              <span className="truncate text-gray-500 dark:text-gray-400">
                {replyingTo.content || (replyingTo.gifUrl ? '[GIF]' : '[Attachment]')}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editing Banner Preview */}
        {editingMessage && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 rounded-t-xl text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Editing message</span>
            <button
              onClick={() => {
                setEditingMessage(null);
                setText('');
              }}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Uploaded attachment chips preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 dark:border-teamsDark-border">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border text-xs"
              >
                {att.mimeType?.startsWith('image/') ? (
                  <ImageIcon className="w-3.5 h-3.5 text-teams-500" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-teams-500" />
                )}
                <span className="max-w-[120px] truncate text-gray-800 dark:text-gray-200 font-medium">
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-400 hover:text-rose-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <div className="px-3 pt-2.5 pb-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${
              activeConversation.type === 'group'
                ? activeConversation.name || 'Group'
                : 'in this chat'
            }... (Type @ to mention, Enter to send)`}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none teams-scrollbar max-h-36"
          />
        </div>

        {/* Action Controls & Send Button */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
            {/* @ Mention Tag Button */}
            <button
              type="button"
              onClick={handleTriggerMention}
              className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors cursor-pointer"
              title="Tag / Mention someone (@)"
            >
              <AtSign className="w-4 h-4" />
            </button>

            {/* Emoji Picker Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors cursor-pointer"
                title="Insert emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {showEmojiPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowEmojiPicker(false)}
                  />
                  <div className="absolute bottom-11 left-0 z-50">
                    <EmojiPicker
                      onSelectEmoji={handleSelectEmoji}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* GIF Picker Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors cursor-pointer"
                title="Search GIFs"
              >
                <Film className="w-4 h-4" />
              </button>

              {showGifPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowGifPicker(false)}
                  />
                  <div className="absolute bottom-11 left-0 z-50">
                    <GifPicker
                      onSelectGif={handleSendGif}
                      onClose={() => setShowGifPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Image Upload Button */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors cursor-pointer"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* File Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors cursor-pointer"
              title="Attach document or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {isUploading && (
              <span className="flex items-center gap-1 text-[11px] text-teams-500 font-medium px-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
              </span>
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && attachments.length === 0) || isUploading}
            className="p-2 rounded-lg bg-teams-500 hover:bg-teams-600 disabled:opacity-40 disabled:hover:bg-teams-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Send (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
