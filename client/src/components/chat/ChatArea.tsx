import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { ForwardMessageModal } from '../modals/ForwardMessageModal';
import { MessageSquare, Search, X } from 'lucide-react';

export const ChatArea: React.FC = () => {
  const { activeConversation, forwardingMessage, setForwardingMessage } = useChat();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilterQuery, setSearchFilterQuery] = useState('');

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-teamsDark-chat p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-teams-50 dark:bg-teams-900/30 text-teams-500 flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Welcome to Teams Chat
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          Select a chat from the sidebar or start a new 1-on-1 private conversation or group with your teammates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-teamsDark-chat overflow-hidden">
      {/* Header */}
      <ChatHeader
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
      />

      {/* In-Chat Filter Search Banner */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-teamsDark-sidebar border-b border-gray-200 dark:border-teamsDark-border animate-fade-in">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchFilterQuery}
            onChange={(e) => setSearchFilterQuery(e.target.value)}
            placeholder="Search messages in this conversation..."
            className="flex-1 text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            autoFocus
          />
          {searchFilterQuery && (
            <button
              onClick={() => setSearchFilterQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <MessageList searchFilterQuery={searchFilterQuery} />

      {/* Message Input Composer */}
      <MessageComposer />

      {/* Forward Modal */}
      <ForwardMessageModal
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
      />
    </div>
  );
};
