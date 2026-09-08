import React, { useState, useMemo } from 'react';
import { Search, Smile, Heart, ThumbsUp, Coffee, Sparkles } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

const emojiCategories = [
  {
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉',
      '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
    ],
  },
  {
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '👑'
    ],
  },
  {
    name: 'Hearts & Vibes',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '🔥', '✨', '⭐', '🌟', '💫', '💥', '💯', '🎉', '🎊', '🎈'
    ],
  },
  {
    name: 'Work & Food',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '💻', '🖥️', '📱', '⌨️', '🖱️', '📈', '📊', '📋',
      '📌', '📍', '📎', '✏️', '📝', '📁', '📂', '🔒', '🔑', '🚀',
      '🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍪', '🍫', '🍿', '🍻'
    ],
  },
  {
    name: 'Reactions',
    icon: Sparkles,
    emojis: [
      '👀', '🧠', '💡', '⚠️', '✅', '❌', '❓', '❗', '🎯', '🏆',
      '🥇', '🎖️', '🏅', '🔔', '📢', '💬', '💭', '🗯️', '⚡', '🌈'
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null;
    const all = emojiCategories.flatMap((c) => c.emojis);
    return all.filter((e) => e.includes(search.trim()));
  }, [search]);

  return (
    <div className="w-72 sm:w-80 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-teams-popover flex flex-col p-3 z-50 select-none animate-fade-in">
      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emojis..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-transparent focus:border-teams-500 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex border-b border-gray-100 dark:border-teamsDark-border pb-2 mb-2 gap-1 justify-around">
          {emojiCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`p-1.5 rounded-md transition-colors ${
                  activeTab === idx
                    ? 'text-teams-500 bg-teams-50 dark:bg-teams-900/40'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto teams-scrollbar p-1">
        {(filteredEmojis || emojiCategories[activeTab].emojis).map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
              if (onClose) onClose();
            }}
            className="w-8 h-8 flex items-center justify-center text-xl rounded-md hover:bg-gray-100 dark:hover:bg-teamsDark-cardHover transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
