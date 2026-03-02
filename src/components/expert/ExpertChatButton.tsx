import { type ExpertType, EXPERT_CONFIGS } from '@/services/expertChatService';
import { cn } from '@/lib/utils';

interface ExpertChatButtonProps {
  expertType: ExpertType;
  onClick: () => void;
  criticalCount?: number;
}

export function ExpertChatButton({ expertType, onClick, criticalCount = 0 }: ExpertChatButtonProps) {
  const config = EXPERT_CONFIGS[expertType];

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg',
        'flex items-center justify-center text-2xl',
        'transition-all duration-200 hover:scale-110 hover:shadow-xl',
        'active:scale-95',
        config.colorBg,
        'border border-border/50'
      )}
      title={`Chat con ${config.name} — ${config.role}`}
    >
      {config.emoji}
      {criticalCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {criticalCount > 9 ? '9+' : criticalCount}
        </span>
      )}
    </button>
  );
}
