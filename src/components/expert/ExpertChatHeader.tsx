import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ExpertType, EXPERT_CONFIGS } from '@/services/expertChatService';
import { cn } from '@/lib/utils';

interface ExpertChatHeaderProps {
  expertType: ExpertType;
  onClear: () => void;
  onClose: () => void;
  hasMessages: boolean;
}

export function ExpertChatHeader({ expertType, onClear, onClose, hasMessages }: ExpertChatHeaderProps) {
  const config = EXPERT_CONFIGS[expertType];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xl', config.colorBg)}>
          {config.emoji}
        </div>
        <div>
          <h3 className={cn('font-semibold text-sm', config.color)}>{config.name}</h3>
          <p className="text-xs text-muted-foreground">{config.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <Button variant="ghost" size="icon" onClick={onClear} title="Limpiar historial" className="h-8 w-8">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
