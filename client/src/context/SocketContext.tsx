import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated && token) {
      const s = connectSocket(token);
      setSocket(s);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      const onOnlineUsersList = (userIds: string[]) => {
        setOnlineUsers(new Set(userIds));
      };

      const onUserOnline = ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      };

      const onUserOffline = ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      };

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      s.on('onlineUsersList', onOnlineUsersList);
      s.on('userOnline', onUserOnline);
      s.on('userOffline', onUserOffline);

      if (s.connected) {
        setIsConnected(true);
      }

      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('onlineUsersList', onOnlineUsersList);
        s.off('userOnline', onUserOnline);
        s.off('userOffline', onUserOffline);
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
    }
  }, [isAuthenticated, token]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
