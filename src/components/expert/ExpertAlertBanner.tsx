import { AlertTriangle, AlertCircle, Info, RefreshCw, X, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type ExpertType, type DiagnosticResult, EXPERT_CONFIGS } from '@/services/expertChatService';
import { cn } from '@/lib/utils';

interface ExpertAlertBannerProps {
  expertType: ExpertType;
  result: DiagnosticResult | null;
  isLoading: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  onRefresh: () => void;
  onOpenChat: () => void;
}

export function ExpertAlertBanner({
  expertType,
  result,
  isLoading,
  dismissed,
  onDismiss,
  onRefresh,
  onOpenChat,
}: ExpertAlertBannerProps) {
  const config = EXPERT_CONFIGS[expertType];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mb-4">
        <Alert className="border-border/50">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0', config.colorBg)}>
              {config.emoji}
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // No result or dismissed
  if (!result || dismissed) {
    if (dismissed) {
      return (
        <div className="mb-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs text-muted-foreground gap-1">
            <RefreshCw className="w-3 h-3" />
            Re-analizar
          </Button>
        </div>
      );
    }
    return null;
  }

  // No alerts
  if (result.alerts.length === 0) return null;

  const hasCritical = result.alerts.some(a => a.severity === 'critical');
  const hasWarning = result.alerts.some(a => a.severity === 'warning');

  const alertVariant = hasCritical ? 'destructive' as const : 'default' as const;
  const borderColor = hasCritical ? 'border-red-300 dark:border-red-800' : hasWarning ? 'border-amber-300 dark:border-amber-800' : 'border-border/50';

  // Show first 2 alerts
  const visibleAlerts = result.alerts.slice(0, 2);
  const remainingCount = result.alerts.length - visibleAlerts.length;

  return (
    <div className="mb-4">
      <Alert variant={alertVariant} className={cn(borderColor)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.emoji}</span>
              <AlertTitle className="text-sm font-semibold">{config.name}: {result.summary}</AlertTitle>
              {result.score > 0 && (
                <Badge variant="outline" className="text-xs">
                  {result.score}/100
                </Badge>
              )}
            </div>

            {visibleAlerts.map((alert, i) => (
              <AlertDescription key={i} className="flex items-start gap-2 text-sm">
                {alert.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                {alert.severity === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                {alert.severity === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                <span>
                  <strong>{alert.title}:</strong> {alert.description}
                </span>
              </AlertDescription>
            ))}

            <div className="flex items-center gap-2 pt-1">
              {remainingCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +{remainingCount} alertas mas
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onOpenChat} className="text-xs gap-1 h-7">
                <MessageCircle className="w-3 h-3" />
                Ver detalles con {config.name}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onRefresh} className="h-7 w-7" title="Re-analizar">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDismiss} className="h-7 w-7" title="Cerrar">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
