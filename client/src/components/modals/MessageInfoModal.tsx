import React from 'react';
import { X, Check, CheckCheck, Clock, Info } from 'lucide-react';
import { Message, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { format } from 'date-fns';

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  if (!isOpen || !message) return null;

  const readList = message.readBy || [];
  const deliveredList = message.deliveredTo || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-teamsDark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teams-100 dark:bg-teams-900/50 flex items-center justify-center text-teams-600 dark:text-teams-400">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Message info
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto teams-scrollbar">
          {/* Message snippet preview */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-teamsDark-input border border-gray-200/70 dark:border-teamsDark-border text-xs">
            <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
              Sent {format(new Date(message.createdAt), 'MMMM d, yyyy · h:mm a')}
            </div>
            <p className="text-gray-800 dark:text-gray-200 line-clamp-3 font-normal">
              {message.content || (message.gifUrl ? '[GIF]' : '[Attachment]')}
            </p>
          </div>

          {/* Read By Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCheck className="w-4 h-4 text-teams-500" />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Read by ({readList.length})
              </h4>
            </div>

            {readList.length === 0 ? (
              <p className="text-xs text-gray-400 italic pl-5">Not read yet</p>
            ) : (
              <div className="space-y-2 pl-2">
                {readList.map((item, idx) => {
                  const u = typeof item.userId === 'object' ? (item.userId as User) : null;
                  const name = u?.displayName || 'Teammate';
                  const readTime = item.readAt ? format(new Date(item.readAt), 'h:mm a') : '';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-teamsDark-input/60"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={name} imageUrl={u?.profilePicture} size="sm" />
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                          {name}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">{readTime}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivered To Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Check className="w-4 h-4 text-gray-500" />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Delivered to ({deliveredList.length})
              </h4>
            </div>

            {deliveredList.length === 0 ? (
              <p className="text-xs text-gray-400 italic pl-5">Not delivered yet</p>
            ) : (
              <div className="space-y-2 pl-2">
                {deliveredList.map((item, idx) => {
                  const u = typeof item.userId === 'object' ? (item.userId as User) : null;
                  const name = u?.displayName || 'Teammate';
                  const deliveredTime = item.deliveredAt
                    ? format(new Date(item.deliveredAt), 'h:mm a')
                    : '';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-teamsDark-input/60"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={name} imageUrl={u?.profilePicture} size="sm" />
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                          {name}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">{deliveredTime}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
