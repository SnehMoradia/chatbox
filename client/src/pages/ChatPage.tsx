import React, { useState } from 'react';
import { NavigationRail } from '../components/sidebar/NavigationRail';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { InfoPanel } from '../components/info/InfoPanel';
import { UserDirectory } from '../components/directory/UserDirectory';
import { useChat } from '../context/ChatContext';

export const ChatPage: React.FC = () => {
  const { activeConversation, isMobileSidebarOpen, isInfoPanelOpen, setIsInfoPanelOpen } = useChat();
  const [activeRailTab, setActiveRailTab] = useState<'chat' | 'directory'>('chat');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-teamsDark-rail">
      {/* 1. Left Navigation Rail (Desktop & Tablet) */}
      <NavigationRail
        activeTab={activeRailTab}
        setActiveTab={(tab) => {
          setActiveRailTab(tab);
        }}
      />

      {/* 2. Chat View vs Directory View */}
      {activeRailTab === 'directory' ? (
        <UserDirectory onStartChat={() => setActiveRailTab('chat')} />
      ) : (
        <div className="flex flex-1 h-full min-w-0 overflow-hidden relative">
          {/* Sidebar: Visible on desktop, or on mobile when sidebar is open or no chat selected */}
          <div
            className={`h-full ${
              activeConversation && !isMobileSidebarOpen ? 'hidden md:flex' : 'flex w-full md:w-auto'
            }`}
          >
            <Sidebar />
          </div>

          {/* Chat Area: Visible on desktop, or on mobile when a chat is selected and sidebar is closed */}
          <div
            className={`flex-1 h-full min-w-0 ${
              !activeConversation || isMobileSidebarOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            <ChatArea />
          </div>

          {/* Right Info Panel (Desktop inline, Mobile slide-over drawer) */}
          {isInfoPanelOpen && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
                onClick={() => setIsInfoPanelOpen(false)}
              />
              <div className="fixed inset-y-0 right-0 z-40 lg:static lg:z-auto">
                <InfoPanel />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
