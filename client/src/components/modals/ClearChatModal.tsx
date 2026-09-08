import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';

interface ClearChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isClearing: boolean;
  conversationName?: string;
}

export const ClearChatModal: React.FC<ClearChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isClearing,
  conversationName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-teamsDark-card rounded-xl shadow-2xl border border-gray-200 dark:border-teamsDark-border p-5 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Clear Entire Chat?
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          Are you sure you want to clear all message history
          {conversationName ? ` in "${conversationName}"` : ''}? All messages and media in this chat will be deleted. This action cannot be undone.
        </p>

        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-teamsDark-input hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isClearing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
};
