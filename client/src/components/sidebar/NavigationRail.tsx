import React, { useState } from 'react';
import { MessageSquare, Users, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { Avatar } from '../common/Avatar';
import { SettingsModal } from '../modals/SettingsModal';
import { UserStatus } from '../../types';

interface NavigationRailProps {
  activeTab: 'chat' | 'directory';
  setActiveTab: (tab: 'chat' | 'directory') => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ activeTab, setActiveTab }) => {
  const { user, updateStatus } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!user) return null;

  const handleStatusChange = async (newStatus: UserStatus) => {
    setShowStatusMenu(false);
    await updateStatus(newStatus);
    if (socket) {
      socket.emit('statusChange', { status: newStatus });
    }
  };

  const statusList: { value: UserStatus; label: string; color: string }[] = [
    { value: 'available', label: 'Available', color: 'bg-emerald-500' },
    { value: 'busy', label: 'Busy', color: 'bg-rose-500' },
    { value: 'away', label: 'Away', color: 'bg-amber-500' },
    { value: 'dnd', label: 'Do Not Disturb', color: 'bg-red-600' },
    { value: 'offline', label: 'Appear Offline', color: 'bg-gray-400' },
  ];

  return (
    <>
      <div className="w-16 bg-teamsLight-rail dark:bg-teamsDark-rail flex flex-col items-center py-3 border-r border-gray-200/80 dark:border-teamsDark-border flex-shrink-0 select-none z-20">
        {/* App Logo */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teams-700 via-teams-500 to-indigo-400 flex items-center justify-center shadow-md text-white font-bold text-lg">
            <span className="tracking-tighter">TC</span>
          </div>
        </div>

        {/* Navigation Rail Icons */}
        <nav className="flex flex-col gap-2 flex-1 w-full px-2">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-full py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-teamsDark-card text-teams-600 dark:text-teams-400 shadow-xs border-l-2 border-teams-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`w-full py-2.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-teamsDark-card text-teams-600 dark:text-teams-400 shadow-xs border-l-2 border-teams-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Directory"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">People</span>
          </button>
        </nav>

        {/* Bottom Actions: Theme, Settings, User Avatar */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-2 border-t border-gray-200 dark:border-teamsDark-border">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Profile Avatar with Presence Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="focus:outline-none"
              title={`${user.displayName} (${user.status})`}
            >
              <Avatar
                name={user.displayName}
                imageUrl={user.profilePicture}
                size="sm"
                status={user.status}
              />
            </button>

            {/* Quick Status Popup */}
            {showStatusMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStatusMenu(false)}
                />
                <div className="absolute left-14 bottom-0 w-44 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-teams-popover py-1.5 z-50 animate-fade-in divide-y divide-gray-100 dark:divide-teamsDark-border">
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">@{user.username}</p>
                  </div>
                  <div className="py-1">
                    {statusList.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => handleStatusChange(st.value)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full ${st.color}`} />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};
