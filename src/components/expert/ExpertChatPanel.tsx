import { Sheet, SheetContent } from '@/components/ui/sheet';
import { type ExpertType } from '@/services/expertChatService';
import { useExpertChat } from '@/hooks/useExpertChat';
import { ExpertChatHeader } from './ExpertChatHeader';
import { ExpertChatMessages } from './ExpertChatMessages';
import { ExpertChatInput } from './ExpertChatInput';

interface ExpertChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  expertType: ExpertType;
}

export function ExpertChatPanel({ open, onOpenChange, projectId, expertType }: ExpertChatPanelProps) {
  const {
    messages,
    isStreaming,
    streamingText,
    error,
    sendMessage,
    cancelStream,
    clearHistory,
  } = useExpertChat(projectId, expertType);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[420px] max-w-[90vw] p-0 flex flex-col [&>button]:hidden"
      >
        <ExpertChatHeader
          expertType={expertType}
          onClear={clearHistory}
          onClose={() => onOpenChange(false)}
          hasMessages={messages.length > 0}
        />

        <ExpertChatMessages
          expertType={expertType}
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          error={error}
          onSuggestionClick={sendMessage}
        />

        <ExpertChatInput
          onSend={sendMessage}
          onCancel={cancelStream}
          isStreaming={isStreaming}
        />
      </SheetContent>
    </Sheet>
  );
}
