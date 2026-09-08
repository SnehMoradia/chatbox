import React from 'react';
import { UserStatus } from '../../types';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: UserStatus;
  isOnline?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const badgeSizeMap = {
  xs: 'w-2 h-2 ring-1',
  sm: 'w-2.5 h-2.5 ring-1.5',
  md: 'w-3 h-3 ring-2',
  lg: 'w-3.5 h-3.5 ring-2',
  xl: 'w-4 h-4 ring-2',
};

// Generates consistent pleasant colors from user names
const stringToColor = (str: string) => {
  const colors = [
    'bg-indigo-600',
    'bg-blue-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-cyan-600',
    'bg-teal-600',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  status,
  isOnline,
  className = '',
}) => {
  // Determine presence color
  const effectiveStatus: UserStatus = isOnline !== undefined
    ? (isOnline ? 'available' : 'offline')
    : (status || 'offline');

  const getStatusColor = (s: UserStatus) => {
    switch (s) {
      case 'available':
        return 'bg-emerald-500';
      case 'busy':
        return 'bg-rose-500';
      case 'dnd':
        return 'bg-red-600';
      case 'away':
        return 'bg-amber-500';
      case 'offline':
      default:
        return 'bg-gray-400 dark:bg-gray-500';
    }
  };

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover shadow-sm`}
          onError={(e) => {
            // fallback to initials on broken image link
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : null}

      <div
        className={`${sizeMap[size]} ${stringToColor(
          name
        )} text-white font-semibold flex items-center justify-center rounded-full select-none shadow-sm ${
          imageUrl ? 'hidden' : 'flex'
        }`}
      >
        {getInitials(name)}
      </div>

      {status !== undefined || isOnline !== undefined ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white dark:ring-teamsDark-rail ${
            badgeSizeMap[size]
          } ${getStatusColor(effectiveStatus)}`}
          title={`Status: ${effectiveStatus}`}
        />
      ) : null}
    </div>
  );
};
