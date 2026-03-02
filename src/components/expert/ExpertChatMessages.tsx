import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ExpertType, type ChatMessage, EXPERT_CONFIGS } from '@/services/expertChatService';
import { cn } from '@/lib/utils';

interface ExpertChatMessagesProps {
  expertType: ExpertType;
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: string | null;
  onSuggestionClick: (text: string) => void;
}

export function ExpertChatMessages({
  expertType,
  messages,
  streamingText,
  isStreaming,
  error,
  onSuggestionClick,
}: ExpertChatMessagesProps) {
  const config = EXPERT_CONFIGS[expertType];
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages or streaming text
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="px-4 py-4 space-y-4 min-h-full">
        {isEmpty ? (
          // Welcome state
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-3xl', config.colorBg)}>
              {config.emoji}
            </div>
            <div>
              <h4 className={cn('font-semibold', config.color)}>{config.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{config.role}</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {config.greeting}
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {config.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages list
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                expertType={expertType}
              />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingText && (
              <div className="flex gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-1', config.colorBg)}>
                  {config.emoji}
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
                  <p className="text-sm whitespace-pre-wrap">{streamingText}<span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" /></p>
                </div>
              </div>
            )}

            {/* Streaming indicator without text yet */}
            {isStreaming && !streamingText && (
              <div className="flex gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-1', config.colorBg)}>
                  {config.emoji}
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300">
                ⚠️ {error}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({ message, expertType }: { message: ChatMessage; expertType: ExpertType }) {
  const config = EXPERT_CONFIGS[expertType];
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-3 py-2 max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-1', config.colorBg)}>
        {config.emoji}
      </div>
      <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 max-w-[85%]">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
