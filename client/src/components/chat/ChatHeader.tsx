import React, { useState } from 'react';
import { ChevronLeft, Info, Pin, Search, Users, X, MoreVertical, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';
import { ClearChatModal } from '../modals/ClearChatModal';
import { format, formatDistanceToNow } from 'date-fns';

interface ChatHeaderProps {
  onToggleSearch?: () => void;
  isSearchOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onToggleSearch, isSearchOpen }) => {
  const {
    activeConversation,
    isInfoPanelOpen,
    setIsInfoPanelOpen,
    setIsMobileSidebarOpen,
    messages,
    clearChat,
  } = useChat();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const otherMember = !isGroup
    ? activeConversation.members.find((m) => m._id !== user?._id)
    : undefined;

  const displayName = isGroup
    ? activeConversation.name || 'Group Chat'
    : otherMember?.displayName || 'Chat';

  const avatarUrl = isGroup
    ? activeConversation.groupPicture
    : otherMember?.profilePicture;

  const isOnline = otherMember ? isUserOnline(otherMember._id) : false;

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  // Format presence subtitle
  const renderSubtitle = () => {
    if (isGroup) {
      return (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {activeConversation.members.length} members
        </span>
      );
    }

    if (isOnline) {
      return (
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {otherMember?.status || 'Available'}
        </span>
      );
    }

    if (otherMember?.lastSeen) {
      try {
        return (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Last seen {formatDistanceToNow(new Date(otherMember.lastSeen), { addSuffix: true })}
          </span>
        );
      } catch {
        return <span className="text-xs text-gray-400">Offline</span>;
      }
    }

    return <span className="text-xs text-gray-400">Offline</span>;
  };

  return (
    <header className="h-16 px-4 bg-white dark:bg-teamsDark-sidebar border-b border-gray-200/80 dark:border-teamsDark-border flex items-center justify-between z-10 select-none flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
          title="Back to Conversations"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <Avatar
          name={displayName}
          imageUrl={avatarUrl}
          size="md"
          status={otherMember?.status}
          isOnline={!isGroup ? isOnline : undefined}
        />

        {/* Title & Status */}
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </h2>
          {renderSubtitle()}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1">
        {/* Pinned Messages Badge / Dropdown */}
        {pinnedMessages.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                showPinnedDropdown
                  ? 'bg-teams-50 dark:bg-teams-900/40 text-teams-600 dark:text-teams-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover'
              }`}
              title={`${pinnedMessages.length} Pinned Messages`}
            >
              <Pin className="w-4 h-4 fill-teams-500 text-teams-500 rotate-45" />
              <span className="text-[11px] text-teams-600 dark:text-teams-400 font-bold">
                {pinnedMessages.length}
              </span>
            </button>

            {/* Pinned Popover */}
            {showPinnedDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowPinnedDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-teams-popover p-3 z-40 animate-fade-in divide-y divide-gray-100 dark:divide-teamsDark-border max-h-80 overflow-y-auto teams-scrollbar">
                  <div className="flex items-center justify-between pb-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Pinned Messages ({pinnedMessages.length})
                    </span>
                    <button
                      onClick={() => setShowPinnedDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {pinnedMessages.map((pm) => (
                    <div key={pm._id} className="py-2 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {pm.senderId.displayName}
                        </span>
                        <span>{format(new Date(pm.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                        {pm.content || (pm.gifUrl ? '[GIF]' : '[Attachment]')}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* In-chat Search Toggle */}
        {onToggleSearch && (
          <button
            type="button"
            onClick={onToggleSearch}
            className={`p-2 rounded-lg transition-colors ${
              isSearchOpen
                ? 'bg-teams-50 dark:bg-teams-900/40 text-teams-600 dark:text-teams-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover'
            }`}
            title="Search in Conversation"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Right Info Panel Toggle */}
        <button
          type="button"
          onClick={() => setIsInfoPanelOpen((prev) => !prev)}
          className={`p-2 rounded-lg transition-colors ${
            isInfoPanelOpen
              ? 'bg-teams-50 dark:bg-teams-900/40 text-teams-600 dark:text-teams-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover'
          }`}
          title="Conversation Details"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* More Options Dropdown (Clear Chat) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showMoreMenu
                ? 'bg-teams-50 dark:bg-teams-900/40 text-teams-600 dark:text-teams-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover'
            }`}
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-teams-popover p-1 z-40 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowClearModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <ClearChatModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={async () => {
          if (!activeConversation) return;
          try {
            setIsClearing(true);
            await clearChat(activeConversation._id);
            setShowClearModal(false);
          } catch (err) {
            console.error('Failed to clear chat:', err);
          } finally {
            setIsClearing(false);
          }
        }}
        isClearing={isClearing}
        conversationName={displayName}
      />
    </header>
  );
};
