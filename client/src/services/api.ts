import axios from 'axios';
import { User, Conversation, Message, GifItem, SearchResults, UserStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('teams_chat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirecting if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('teams_chat_token');
        localStorage.removeItem('teams_chat_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: { username: string; displayName: string; email: string; password: string }) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },
  updateStatus: async (status: UserStatus) => {
    const res = await api.put<{ success: boolean; user: User }>('/auth/status', { status });
    return res.data;
  },
  logout: async () => {
    const res = await api.post<{ success: boolean; message: string }>('/auth/logout');
    return res.data;
  },
};

// Users Endpoints
export const usersApi = {
  search: async (query: string) => {
    const res = await api.get<{ success: boolean; users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get<{ success: boolean; users: User[] }>('/users');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; user: User }>(`/users/${id}`);
    return res.data;
  },
  updateProfile: async (data: { displayName?: string; bio?: string; profilePicture?: string }) => {
    const res = await api.put<{ success: boolean; user: User }>('/users/profile', data);
    return res.data;
  },
};

// Conversations Endpoints
export const conversationsApi = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; conversations: Conversation[] }>('/conversations');
    return res.data;
  },
  getOrCreatePrivate: async (recipientId: string) => {
    const res = await api.post<{ success: boolean; conversation: Conversation }>('/conversations/private', { recipientId });
    return res.data;
  },
  createGroup: async (groupData: { name: string; description?: string; groupPicture?: string; members: string[] }) => {
    const res = await api.post<{ success: boolean; conversation: Conversation }>('/conversations/group', groupData);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; conversation: Conversation }>(`/conversations/${id}`);
    return res.data;
  },
  updateGroup: async (id: string, data: { name?: string; description?: string; groupPicture?: string }) => {
    const res = await api.put<{ success: boolean; conversation: Conversation }>(`/conversations/${id}`, data);
    return res.data;
  },
  addMembers: async (id: string, memberIds: string[]) => {
    const res = await api.post<{ success: boolean; conversation: Conversation }>(`/conversations/${id}/members`, { memberIds });
    return res.data;
  },
  removeMember: async (id: string, memberId: string) => {
    const res = await api.delete<{ success: boolean; conversation: Conversation }>(`/conversations/${id}/members/${memberId}`);
    return res.data;
  },
  toggleAdmin: async (id: string, memberId: string) => {
    const res = await api.put<{ success: boolean; conversation: Conversation }>(`/conversations/${id}/admin/${memberId}`);
    return res.data;
  },
  leaveGroup: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/conversations/${id}/leave`);
    return res.data;
  },
};

// Messages Endpoints
export const messagesApi = {
  getByConversation: async (conversationId: string, page = 1, limit = 50) => {
    const res = await api.get<{ success: boolean; messages: Message[]; total: number; page: number; pages: number }>(
      `/messages/${conversationId}?page=${page}&limit=${limit}`
    );
    return res.data;
  },
  sendMessage: async (messageData: {
    conversationId: string;
    content?: string;
    messageType?: 'text' | 'image' | 'file' | 'gif';
    attachments?: Array<{ url: string; name: string; size: number; mimeType: string }>;
    gifUrl?: string;
    replyTo?: string;
  }) => {
    const res = await api.post<{ success: boolean; message: Message }>('/messages', messageData);
    return res.data;
  },
  editMessage: async (id: string, content: string) => {
    const res = await api.put<{ success: boolean; message: Message }>(`/messages/${id}`, { content });
    return res.data;
  },
  deleteMessage: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: { _id: string; conversationId: string; isDeleted: boolean; content: string } }>(
      `/messages/${id}`
    );
    return res.data;
  },
  toggleReaction: async (id: string, emoji: string) => {
    const res = await api.post<{ success: boolean; reactions: Message['reactions']; messageId: string }>(
      `/messages/${id}/react`,
      { emoji }
    );
    return res.data;
  },
  togglePin: async (id: string) => {
    const res = await api.post<{ success: boolean; isPinned: boolean; messageId: string }>(`/messages/${id}/pin`);
    return res.data;
  },
  forwardMessage: async (id: string, targetConversationIds: string[]) => {
    const res = await api.post<{ success: boolean; messages: Message[] }>(`/messages/${id}/forward`, {
      targetConversationIds,
    });
    return res.data;
  },
  markAsRead: async (conversationId: string) => {
    const res = await api.put<{ success: boolean; message: string; conversationId: string }>(
      `/messages/${conversationId}/read`
    );
    return res.data;
  },
  getMedia: async (conversationId: string) => {
    const res = await api.get<{
      success: boolean;
      media: Array<{ type: 'image' | 'gif'; url: string; name?: string; size?: number; messageId: string; createdAt: string }>;
      files: Array<{ type: 'file'; url: string; name: string; size: number; mimeType: string; messageId: string; createdAt: string }>;
    }>(`/messages/${conversationId}/media`);
    return res.data;
  },
};

// Uploads Endpoints
export const uploadsApi = {
  uploadSingle: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{
      success: boolean;
      file: { url: string; name: string; size: number; mimeType: string };
    }>('/uploads/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await api.post<{
      success: boolean;
      files: Array<{ url: string; name: string; size: number; mimeType: string }>;
    }>('/uploads/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// GIF Endpoints
export const gifsApi = {
  getTrending: async (limit = 20) => {
    const res = await api.get<{ success: boolean; gifs: GifItem[] }>(`/gifs/trending?limit=${limit}`);
    return res.data;
  },
  search: async (query: string, limit = 20) => {
    const res = await api.get<{ success: boolean; gifs: GifItem[] }>(`/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return res.data;
  },
};

// Search Endpoint
export const searchApi = {
  globalSearch: async (query: string, type?: 'all' | 'users' | 'groups' | 'messages') => {
    const typeParam = type ? `&type=${type}` : '';
    const res = await api.get<{ success: boolean; query: string; results: SearchResults }>(
      `/search?q=${encodeURIComponent(query)}${typeParam}`
    );
    return res.data;
  },
};

export default api;
