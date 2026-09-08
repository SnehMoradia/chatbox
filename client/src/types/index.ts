export type UserStatus = 'available' | 'busy' | 'away' | 'dnd' | 'offline';

export interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  status: UserStatus;
  lastSeen?: string;
  createdAt?: string;
}

export interface Attachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Reaction {
  _id?: string;
  userId: string | { _id: string; username: string; displayName: string };
  emoji: string;
  createdAt?: string;
}

export interface ReadReceipt {
  userId: string | { _id: string; username: string; displayName: string };
  readAt: string;
}

export interface DeliveredReceipt {
  userId: string | { _id: string; username: string; displayName: string };
  deliveredAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'gif';
  attachments?: Attachment[];
  gifUrl?: string | null;
  replyTo?: Message | null;
  reactions: Reaction[];
  readBy: ReadReceipt[];
  deliveredTo: DeliveredReceipt[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: 'private' | 'group';
  name?: string;
  groupPicture?: string;
  description?: string;
  members: User[];
  admins?: User[];
  createdBy?: User;
  lastMessage?: Message | null;
  pinnedMessages?: (Message | string)[];
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GifItem {
  id: string;
  title: string;
  url: string;
  preview: string;
}

export interface SearchResults {
  users: User[];
  groups: Conversation[];
  messages: Message[];
}
