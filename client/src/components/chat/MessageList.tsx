import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageItem } from './MessageItem';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronDown, MessageSquare, Loader2 } from 'lucide-react';

interface MessageListProps {
  searchFilterQuery?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ searchFilterQuery }) => {
  const { messages, isLoadingMessages, typingUsers, activeConversation } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers, showScrollToBottom]);

  // When active conversation changes, scroll directly to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [activeConversation?._id]);

  // Track scroll position to show "Scroll to bottom" floating pill
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollToBottom(isUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  // Clean, centered date separator matching Screenshot 2 reference
  const renderDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    let label = format(date, 'MMMM d, yyyy');
    if (isToday(date)) label = `Today ${format(date, 'h:mm a')}`;
    else if (isYesterday(date)) label = `Yesterday ${format(date, 'h:mm a')}`;

    return (
      <div key={`date-${dateStr}`} className="flex items-center justify-center my-3 select-none px-6">
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
    );
  };

  // Filter messages by in-chat search query if active
  const filteredMessages = searchFilterQuery?.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchFilterQuery.toLowerCase().trim())
      )
    : messages;

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-teams-500" />
          <span className="text-xs text-gray-400">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-white dark:bg-teamsDark-chat">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto teams-scrollbar py-3"
      >
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-14 h-14 rounded-2xl bg-teams-50 dark:bg-teams-900/30 text-teams-500 flex items-center justify-center mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No messages yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Be the first to say hello or share files with your team in this channel.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredMessages.map((msg, index) => {
              const currentDate = format(new Date(msg.createdAt), 'yyyy-MM-dd');
              const prevDate =
                index > 0
                  ? format(new Date(filteredMessages[index - 1].createdAt), 'yyyy-MM-dd')
                  : null;

              const showDate = currentDate !== prevDate;
              const prevMsg = index > 0 ? filteredMessages[index - 1] : null;

              const prevSenderId =
                typeof prevMsg?.senderId === 'object'
                  ? prevMsg?.senderId?._id
                  : prevMsg?.senderId;
              const currSenderId =
                typeof msg.senderId === 'object'
                  ? msg.senderId?._id
                  : msg.senderId;

              const isSameSenderAsPrev =
                !showDate &&
                Boolean(prevMsg) &&
                prevSenderId === currSenderId &&
                Math.abs(
                  new Date(msg.createdAt).getTime() -
                    new Date(prevMsg!.createdAt).getTime()
                ) < 5 * 60 * 1000;

              return (
                <React.Fragment key={msg._id}>
                  {showDate && renderDateSeparator(msg.createdAt)}
                  <MessageItem
                    message={msg}
                    isSameSenderAsPrev={isSameSenderAsPrev}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Typing indicator bubble */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 animate-fade-in select-none">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-teamsDark-card py-1 px-2.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teams-500 typing-dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-teams-500 typing-dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-teams-500 typing-dot-3" />
            </div>
            <span className="italic text-[11px]">
              {typingUsers.map((u) => u.displayName).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating "Scroll to latest" button */}
      {showScrollToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 px-3 py-1.5 rounded-full bg-white dark:bg-teamsDark-card text-teams-600 dark:text-teams-400 border border-gray-200 dark:border-teamsDark-border shadow-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-teamsDark-cardHover transition-transform hover:scale-105 select-none z-10"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Latest Messages
        </button>
      )}
    </div>
  );
};
