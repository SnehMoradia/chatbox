import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, Loader2 } from 'lucide-react';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { getOrCreatePrivateChat } = useChat();
  const { isUserOnline } = useSocket();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setUsers([]);
      return;
    }

    // Load initial users directory
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await usersApi.getAll();
        if (res.success) {
          setUsers(res.users);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Handle debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await usersApi.search(query.trim());
        if (res.success) {
          setUsers(res.users);
        }
      } catch (err) {
        console.error('Failed searching users:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleStartChat = async (recipientId: string) => {
    setIsSubmitting(true);
    try {
      await getOrCreatePrivateChat(recipientId);
      onClose();
    } catch (err) {
      console.error('Error starting chat:', err);
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
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              New Private Chat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, @username, or email..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 max-h-80 overflow-y-auto teams-scrollbar p-2">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-teams-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No users found matching your search.
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((u) => {
                const online = isUserOnline(u._id);
                return (
                  <button
                    key={u._id}
                    disabled={isSubmitting}
                    onClick={() => handleStartChat(u._id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover text-left transition-colors group cursor-pointer disabled:opacity-50"
                  >
                    <Avatar
                      name={u.displayName}
                      imageUrl={u.profilePicture}
                      size="md"
                      status={u.status}
                      isOnline={online}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-teams-500">
                          {u.displayName}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          @{u.username}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {u.bio || u.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
