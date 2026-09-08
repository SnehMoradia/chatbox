import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Loader2, Mail, AtSign, Users } from 'lucide-react';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';

interface UserDirectoryProps {
  onStartChat: () => void;
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ onStartChat }) => {
  const { getOrCreatePrivateChat } = useChat();
  const { isUserOnline } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDirectory = async () => {
      setIsLoading(true);
      try {
        const res = await usersApi.getAll();
        if (res.success) {
          setUsers(res.users);
        }
      } catch (err) {
        console.error('Failed fetching directory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.bio?.toLowerCase().includes(query.toLowerCase())
  );

  const handleChat = async (userId: string) => {
    setLoadingChatId(userId);
    try {
      await getOrCreatePrivateChat(userId);
      onStartChat();
    } catch (err) {
      console.error('Failed to open chat:', err);
    } finally {
      setLoadingChatId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-teamsDark-chat overflow-hidden select-none">
      {/* Directory Header */}
      <div className="p-6 bg-white dark:bg-teamsDark-sidebar border-b border-gray-200/80 dark:border-teamsDark-border flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teams-100 dark:bg-teams-900/50 text-teams-600 dark:text-teams-400 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                People & Directory
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Find teammates, check their presence, and start real-time messaging.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-100 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-transparent focus:border-teams-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="flex-1 overflow-y-auto teams-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-teams-500" />
              <span className="text-xs text-gray-400">Loading directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-400">
              No colleagues found matching your query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((colleague) => {
                const isOnline = isUserOnline(colleague._id);
                const isStarting = loadingChatId === colleague._id;

                return (
                  <div
                    key={colleague._id}
                    className="p-4 rounded-xl bg-white dark:bg-teamsDark-card border border-gray-200/80 dark:border-teamsDark-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar
                          name={colleague.displayName}
                          imageUrl={colleague.profilePicture}
                          size="lg"
                          status={colleague.status}
                          isOnline={isOnline}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {colleague.displayName}
                          </h4>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <AtSign className="w-3 h-3" />
                            {colleague.username}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 min-h-[2rem]">
                        {colleague.bio || 'Available for collaboration.'}
                      </p>

                      <div className="space-y-1 mb-4 text-[11px] text-gray-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{colleague.email}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isStarting}
                      onClick={() => handleChat(colleague._id)}
                      className="w-full py-2 px-3 rounded-lg bg-teams-500 hover:bg-teams-600 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isStarting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                      Message
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
