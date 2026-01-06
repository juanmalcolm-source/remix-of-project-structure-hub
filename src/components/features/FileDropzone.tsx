import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export default function FileDropzone({
  onFileSelect,
  isLoading = false,
  error = null,
  disabled = false,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: disabled || isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-2xl p-16 text-center transition-all duration-200',
        // Estado normal
        !isDragActive && !error && !isLoading && 'border-2 border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20',
        // Estado arrastrando válido - borde azul sólido grueso
        isDragActive && !isDragReject && 'border-4 border-solid border-primary bg-primary/5 animate-pulse',
        // Estado arrastrando inválido
        isDragReject && 'border-2 border-dashed border-destructive bg-destructive/5',
        // Estado error
        error && 'border-2 border-dashed border-destructive bg-destructive/5',
        // Estado cargando
        isLoading && 'border-2 border-dashed border-muted-foreground/30 bg-muted/10 cursor-wait opacity-60',
        'cursor-pointer',
        // Deshabilitado
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-6">
        {/* Icono */}
        <div className="text-6xl">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mx-auto" />
          ) : error ? (
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          ) : isDragActive && !isDragReject ? (
            <span>📄 ✨</span>
          ) : (
            '📄'
          )}
        </div>

        {/* Texto principal */}
        <div className="space-y-1">
          {isLoading ? (
            <p className="text-base text-muted-foreground">
              Procesando archivo...
            </p>
          ) : error ? (
            <p className="text-base text-destructive font-medium">
              {error}
            </p>
          ) : isDragActive && !isDragReject ? (
            <p className="text-base text-foreground font-medium">
              ¡Suelta el archivo aquí!
            </p>
          ) : (
            <>
              <p className="text-base text-foreground">
                Arrastra tu guión aquí
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar
              </p>
            </>
          )}
        </div>

        {/* Indicador de formatos */}
        {!isLoading && !error && !isDragActive && (
          <p className="text-sm text-muted-foreground">
            PDF, TXT • máx 10MB
          </p>
        )}
      </div>
    </div>
  );
}
