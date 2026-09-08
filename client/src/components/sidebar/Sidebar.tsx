import React, { useState, useMemo } from 'react';
import { Search, SquarePen, Users, MessageSquare, Filter, X, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { ConversationItem } from './ConversationItem';
import { NewChatModal } from '../modals/NewChatModal';
import { CreateGroupModal } from '../modals/CreateGroupModal';
import { searchApi } from '../../services/api';
import { SearchResults } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    isLoadingConversations,
    typingUsers,
    getOrCreatePrivateChat,
  } = useChat();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Global search state
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Handle global search debounce
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const res = await searchApi.globalSearch(searchQuery.trim());
        if (res.success) {
          setSearchResults(res.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter conversations based on tab and local search query
  const filteredConversations = useMemo(() => {
    return conversations.filter((convo) => {
      // Tab filter
      if (filterTab === 'unread' && (!convo.unreadCount || convo.unreadCount === 0)) {
        return false;
      }
      if (filterTab === 'groups' && convo.type !== 'group') {
        return false;
      }

      // Query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      if (convo.type === 'group') {
        return (
          convo.name?.toLowerCase().includes(q) ||
          convo.description?.toLowerCase().includes(q) ||
          convo.lastMessage?.content?.toLowerCase().includes(q)
        );
      } else {
        const other = convo.members.find((m) => m._id !== user?._id);
        return (
          other?.displayName?.toLowerCase().includes(q) ||
          other?.username?.toLowerCase().includes(q) ||
          convo.lastMessage?.content?.toLowerCase().includes(q)
        );
      }
    });
  }, [conversations, filterTab, searchQuery, user?._id]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <>
      <aside className="w-full md:w-80 lg:w-96 bg-teamsLight-sidebar dark:bg-teamsDark-sidebar border-r border-gray-200/80 dark:border-teamsDark-border flex flex-col h-full select-none flex-shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 pb-2 border-b border-gray-200/60 dark:border-teamsDark-border/60">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Chat
              {totalUnreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-teams-500 text-white font-semibold">
                  {totalUnreadCount}
                </span>
              )}
            </h1>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-teams-600 dark:hover:text-teams-400 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors"
                title="New Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-teams-600 dark:hover:text-teams-400 hover:bg-gray-200/60 dark:hover:bg-teamsDark-card transition-colors"
                title="New Group"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats, people, and messages..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-200/60 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg border border-transparent focus:border-teams-500 focus:bg-white dark:focus:bg-teamsDark-card focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 pt-1">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-teams-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-teamsDark-card'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-teams-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-teamsDark-card'
              }`}
            >
              Unread
              {totalUnreadCount > 0 && (
                <span className="text-[10px] opacity-90 font-bold">({totalUnreadCount})</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('groups')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterTab === 'groups'
                  ? 'bg-teams-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-teamsDark-card'
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Search Results Dropdown Overlay (if global search has items) */}
        {searchQuery.trim() && searchResults && (
          <div className="p-2 border-b border-gray-200 dark:border-teamsDark-border bg-white dark:bg-teamsDark-card text-xs">
            <div className="flex items-center justify-between pb-1.5 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
              <span>Search Results</span>
              {isSearchingGlobal && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>

            {/* People matched */}
            {searchResults.users.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] text-teams-600 dark:text-teams-400 font-bold">PEOPLE</span>
                {searchResults.users.slice(0, 3).map((u) => (
                  <div
                    key={u._id}
                    onClick={async () => {
                      await getOrCreatePrivateChat(u._id);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover cursor-pointer"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{u.displayName}</span>
                    <span className="text-gray-400 text-[10px]">@{u.username}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Messages matched */}
            {searchResults.messages.length > 0 && (
              <div>
                <span className="text-[10px] text-teams-600 dark:text-teams-400 font-bold">MESSAGES</span>
                {searchResults.messages.slice(0, 3).map((m) => (
                  <div
                    key={m._id}
                    onClick={async () => {
                      const foundConvo = conversations.find((c) => c._id === m.conversationId);
                      if (foundConvo) {
                        await selectConversation(foundConvo);
                        setSearchQuery('');
                      }
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover cursor-pointer"
                  >
                    <div className="text-[11px] text-gray-900 dark:text-gray-100 font-medium truncate">
                      {m.senderId?.displayName}: <span className="text-gray-600 dark:text-gray-300 font-normal">{m.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto teams-scrollbar p-2 space-y-1">
          {isLoadingConversations ? (
            // Skeleton loaders
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-teamsDark-border" />
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-3 rounded bg-gray-200 dark:bg-teamsDark-border" />
                    <div className="w-40 h-2.5 rounded bg-gray-200 dark:bg-teamsDark-border" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-teams-50 dark:bg-teams-900/30 text-teams-500 mx-auto flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                No conversations found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {filterTab === 'unread'
                  ? 'All caught up! No unread messages.'
                  : 'Start a new conversation with a teammate or group.'}
              </p>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-teams-500 hover:bg-teams-600 text-white font-medium text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <SquarePen className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isTyping =
                activeConversation?._id === convo._id &&
                typingUsers.length > 0;

              return (
                <ConversationItem
                  key={convo._id}
                  conversation={convo}
                  isActive={activeConversation?._id === convo._id}
                  onClick={() => selectConversation(convo)}
                  isTyping={isTyping}
                />
              );
            })
          )}
        </div>
      </aside>

      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
    </>
  );
};
