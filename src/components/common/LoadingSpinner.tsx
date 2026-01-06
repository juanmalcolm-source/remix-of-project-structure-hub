import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({
  message = 'Cargando...',
  submessage,
  progress,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const showProgress = typeof progress === 'number' && progress >= 0 && progress <= 100;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-6', className)}>
      {/* Spinner animado */}
      <div className="relative">
        <Loader2 className={cn('text-primary animate-spin', sizeClasses[size])} />
        
        {/* Pulso de fondo */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-primary/20 animate-ping',
          sizeClasses[size]
        )} />
      </div>

      {/* Mensajes */}
      <div className="space-y-1 text-center max-w-md">
        <p className="text-base font-medium text-foreground">
          {message}
        </p>
        
        {submessage && (
          <p className="text-sm text-muted-foreground">
            {submessage}
          </p>
        )}
      </div>

      {/* Barra de progreso */}
      {showProgress && (
        <div className="w-full max-w-xs space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {progress}% completado
          </p>
        </div>
      )}
    </div>
  );
}
