import React, { useState, useMemo, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { ForwardMessageModal } from '../modals/ForwardMessageModal';
import { MessageSquare, Search, X, ChevronUp, ChevronDown } from 'lucide-react';

export const ChatArea: React.FC = () => {
  const { activeConversation, forwardingMessage, setForwardingMessage, messages } = useChat();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilterQuery, setSearchFilterQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Compute all matching message IDs without hiding any messages
  const searchMatches = useMemo(() => {
    const q = searchFilterQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => !m.isDeleted && m.content && m.content.toLowerCase().includes(q))
      .map((m) => m._id);
  }, [messages, searchFilterQuery]);

  // When search query or matching list changes, jump to the most recent match
  useEffect(() => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex(searchMatches.length - 1);
    } else {
      setCurrentMatchIndex(0);
    }
  }, [searchMatches.length, searchFilterQuery]);

  const activeMatchId = searchMatches.length > 0 ? searchMatches[currentMatchIndex] : undefined;

  // Smooth scroll to the active matching message in the chat
  useEffect(() => {
    if (activeMatchId) {
      const el = document.getElementById(`msg-${activeMatchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeMatchId, currentMatchIndex]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev < searchMatches.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : searchMatches.length - 1));
  };

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
        onToggleSearch={() => {
          setIsSearchOpen(!isSearchOpen);
          if (isSearchOpen) setSearchFilterQuery('');
        }}
        isSearchOpen={isSearchOpen}
      />

      {/* In-Chat Search Navigation Banner */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-teamsDark-sidebar border-b border-gray-200 dark:border-teamsDark-border animate-fade-in text-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchFilterQuery}
            onChange={(e) => setSearchFilterQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) handlePrevMatch();
                else handleNextMatch();
              }
            }}
            placeholder="Search messages in this conversation (Enter = next, Shift+Enter = prev)..."
            className="flex-1 text-xs bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            autoFocus
          />

          {searchFilterQuery.trim() && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 select-none">
              <span className="font-medium mr-1">
                {searchMatches.length > 0
                  ? `${currentMatchIndex + 1} of ${searchMatches.length}`
                  : '0 matches'}
              </span>

              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={searchMatches.length === 0}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover disabled:opacity-30 transition-colors cursor-pointer"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextMatch}
                disabled={searchMatches.length === 0}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover disabled:opacity-30 transition-colors cursor-pointer"
                title="Next match (Enter)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSearchFilterQuery('')}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false);
              setSearchFilterQuery('');
            }}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-1"
            title="Close search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <MessageList
        searchFilterQuery={searchFilterQuery}
        activeMatchId={activeMatchId}
      />

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
