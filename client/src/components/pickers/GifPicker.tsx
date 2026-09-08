import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';
import { gifsApi } from '../../services/api';
import { GifItem } from '../../types';

interface GifPickerProps {
  onSelectGif: (gifUrl: string) => void;
  onClose?: () => void;
}

const CATEGORIES = [
  { label: 'Trending', query: '' },
  { label: '👋 Hello', query: 'hello' },
  { label: '👍 Yes', query: 'yes' },
  { label: '😂 LOL', query: 'lol' },
  { label: '🎉 Party', query: 'party' },
  { label: '❤️ Love', query: 'love' },
  { label: '👏 Clap', query: 'clap' },
  { label: '😭 Sad', query: 'sad' },
  { label: '🤔 Hmm', query: 'thinking' },
  { label: '💻 Work', query: 'work' },
  { label: '🐱 Cat', query: 'cat' },
  { label: '☕ Coffee', query: 'coffee' },
  { label: '👋 Bye', query: 'bye' },
];

export const GifPicker: React.FC<GifPickerProps> = ({ onSelectGif, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load trending GIFs on mount or when category/query resets to empty
  const loadTrending = async () => {
    setIsLoading(true);
    try {
      const res = await gifsApi.getTrending(24);
      if (res.success) {
        setGifs(res.gifs);
      }
    } catch (err) {
      console.error('Failed to load trending GIFs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  // Handle debounced search when user types or selects a category
  useEffect(() => {
    if (!query.trim()) {
      if (selectedCategory === 'Trending') {
        loadTrending();
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await gifsApi.search(query.trim(), 24);
        if (res.success) {
          setGifs(res.gifs);
        }
      } catch (err) {
        console.error('GIF search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCategory = (cat: { label: string; query: string }) => {
    setSelectedCategory(cat.label);
    if (!cat.query) {
      setQuery('');
      loadTrending();
    } else {
      setQuery(cat.query);
    }
    searchInputRef.current?.focus();
  };

  return (
    <div className="w-80 sm:w-96 bg-white dark:bg-teamsDark-card border border-gray-200 dark:border-teamsDark-border rounded-xl shadow-teams-popover flex flex-col p-3 z-50 select-none animate-fade-in max-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-teamsDark-border mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teams-500" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {query.trim() ? `Search: "${query}"` : 'Trending GIFs'}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-2">
        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) {
              setSelectedCategory('Trending');
            }
          }}
          placeholder="Search all GIFs (e.g. hello, haha, work)..."
          className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-100 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-lg border border-transparent focus:border-teams-500 focus:outline-none placeholder-gray-400"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('Trending');
              loadTrending();
              searchInputRef.current?.focus();
            }}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto teams-scrollbar pb-2 mb-2 select-none">
        {CATEGORIES.map((cat) => {
          const isActive =
            (cat.query === '' && !query.trim()) ||
            (cat.query && query.toLowerCase().trim() === cat.query.toLowerCase());

          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-teams-500 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-teamsDark-input text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-teamsDark-cardHover'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto teams-scrollbar min-h-56 max-h-64">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teams-500" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-gray-400 text-xs gap-2">
            <p>No GIFs found matching &ldquo;{query}&rdquo;</p>
            <p className="text-[11px] text-gray-500">Try one of these popular tags:</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['hello', 'yes', 'party', 'cat', 'lol'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setQuery(tag);
                    searchInputRef.current?.focus();
                  }}
                  className="px-2 py-0.5 rounded bg-gray-100 dark:bg-teamsDark-input text-[11px] text-teams-600 dark:text-teams-400 hover:underline"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => {
                  onSelectGif(gif.url);
                  if (onClose) onClose();
                }}
                className="group relative rounded-lg overflow-hidden h-28 bg-gray-100 dark:bg-teamsDark-input focus:outline-none focus:ring-2 focus:ring-teams-500 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <img
                  src={gif.preview || gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                  <span className="text-[10px] text-white truncate drop-shadow">
                    {gif.title || 'GIF'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
