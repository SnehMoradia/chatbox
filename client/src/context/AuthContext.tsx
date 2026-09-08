import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserStatus } from '../types';
import { authApi, usersApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { username: string; displayName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateStatus: (status: UserStatus) => Promise<void>;
  updateProfile: (data: { displayName?: string; bio?: string; profilePicture?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('teams_chat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize: verify stored token and fetch user
  const initAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('teams_chat_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(savedToken);
      } else {
        localStorage.removeItem('teams_chat_token');
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Auth token validation failed, logging out:', err);
      localStorage.removeItem('teams_chat_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      if (data.success && data.token) {
        localStorage.setItem('teams_chat_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { username: string; displayName: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(userData);
      if (data.success && data.token) {
        localStorage.setItem('teams_chat_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Error during logout request:', err);
    } finally {
      localStorage.removeItem('teams_chat_token');
      setUser(null);
      setToken(null);
    }
  };

  const updateStatus = async (status: UserStatus) => {
    const data = await authApi.updateStatus(status);
    if (data.success && data.user) {
      setUser(data.user);
    }
  };

  const updateProfile = async (data: { displayName?: string; bio?: string; profilePicture?: string }) => {
    const res = await usersApi.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const refreshUser = async () => {
    const data = await authApi.getMe();
    if (data.success && data.user) {
      setUser(data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        updateStatus,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
