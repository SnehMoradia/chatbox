import React, { useState } from 'react';
import { X, Forward, Search, Check, Loader2 } from 'lucide-react';
import { Message, Conversation } from '../../types';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface ForwardMessageModalProps {
  message: Message | null;
  onClose: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({ message, onClose }) => {
  const { conversations, forwardMessage } = useChat();
  const { user } = useAuth();
  const [selectedConvoIds, setSelectedConvoIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!message) return null;

  const toggleSelect = (convoId: string) => {
    setSelectedConvoIds((prev) =>
      prev.includes(convoId) ? prev.filter((id) => id !== convoId) : [...prev, convoId]
    );
  };

  const getConversationDisplayName = (convo: Conversation) => {
    if (convo.type === 'group') return convo.name || 'Group Chat';
    const otherMember = convo.members.find((m) => m._id !== user?._id);
    return otherMember?.displayName || 'Private Chat';
  };

  const filteredConversations = conversations.filter((c) =>
    getConversationDisplayName(c).toLowerCase().includes(query.toLowerCase())
  );

  const handleForward = async () => {
    if (selectedConvoIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await forwardMessage(message._id, selectedConvoIds);
      onClose();
    } catch (err) {
      console.error('Failed to forward:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teams-100 dark:bg-teams-900/50 flex items-center justify-center text-teams-600 dark:text-teams-400">
              <Forward className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Forward Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3.5 mx-4 mt-3 bg-gray-50 dark:bg-teamsDark-input rounded-lg border border-gray-200/60 dark:border-teamsDark-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
            Original from {message.senderId.displayName}:
          </span>
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
            {message.content || (message.gifUrl ? '[GIF]' : '[Attachment]')}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 max-h-64 overflow-y-auto teams-scrollbar p-2 space-y-1">
          {filteredConversations.map((convo) => {
            const isSelected = selectedConvoIds.includes(convo._id);
            const title = getConversationDisplayName(convo);
            const isGroup = convo.type === 'group';
            const other = !isGroup ? convo.members.find((m) => m._id !== user?._id) : null;

            return (
              <div
                key={convo._id}
                onClick={() => toggleSelect(convo._id)}
                className={`flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover cursor-pointer transition-colors ${
                  isSelected ? 'bg-teams-50 dark:bg-teams-900/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={title}
                    imageUrl={isGroup ? convo.groupPicture : other?.profilePicture}
                    size="sm"
                  />
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {title}
                  </span>
                </div>

                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-teams-500 border-teams-500 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-teamsDark-input/50 border-t border-gray-100 dark:border-teamsDark-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-teamsDark-card rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || selectedConvoIds.length === 0}
            onClick={handleForward}
            className="px-4 py-2 text-xs font-semibold text-white bg-teams-500 hover:bg-teams-600 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Forward ({selectedConvoIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
