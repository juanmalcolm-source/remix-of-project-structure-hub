import { FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

interface FilePreviewProps {
  file: File;
  progreso?: number;
  isLoading?: boolean;
  onRemove: () => void;
  extractedText?: string;
}

export default function FilePreview({
  file,
  progreso = 0,
  isLoading = false,
  onRemove,
  extractedText = '',
}: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const getEstimatedPages = (text: string): number => {
    // Aproximadamente 250 palabras por página
    const words = getWordCount(text);
    return Math.ceil(words / 250);
  };

  const getPreviewText = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 5).join('\n');
  };

  const isPDF = file.type === 'application/pdf';
  const wordCount = extractedText ? getWordCount(extractedText) : 0;
  const estimatedPages = extractedText ? getEstimatedPages(extractedText) : 0;
  const previewText = extractedText ? getPreviewText(extractedText) : '';

  return (
    <Card className="overflow-hidden animate-scale-in">
      {/* Header con nombre de archivo */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-2xl">📄</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">
              {file.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        {/* Botón eliminar */}
        {!isLoading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Barra de progreso */}
      {isLoading && progreso > 0 && (
        <div className="p-4 space-y-2 border-b">
          <Progress value={progreso} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Extrayendo texto... {progreso}%
          </p>
        </div>
      )}

      {/* Preview del texto */}
      {!isLoading && extractedText && (
        <>
          <div className="p-4 bg-muted/10">
            <pre className="text-sm text-foreground font-mono whitespace-pre-wrap max-h-32 overflow-hidden">
              {isExpanded ? extractedText : previewText}
            </pre>
            {!isExpanded && extractedText.split('\n').length > 5 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
              >
                [...ver más] <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {isExpanded && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
              >
                [ver menos] <ChevronUp className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="p-4 border-t bg-muted/30">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>📊</span>
              <span>{wordCount.toLocaleString()} palabras</span>
              <span>•</span>
              <span>~{estimatedPages} páginas</span>
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
