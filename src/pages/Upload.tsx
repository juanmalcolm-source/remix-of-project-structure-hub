import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import FileDropzone from '@/components/features/FileDropzone';
import FilePreview from '@/components/features/FilePreview';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { analizarGuion, obtenerMensajeError } from '@/services/analisisService';
import type { AnalisisGuion } from '@/types/analisisGuion';

export default function Upload() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const { toast } = useToast();
  
  const {
    archivo,
    textoExtraido,
    isLoading,
    error,
    progreso,
    handleFileSelect,
    resetUpload,
  } = useFileUpload();

  const getProgressMessage = (progress: number): { message: string; submessage: string } => {
    if (progress < 20) {
      return {
        message: 'Subiendo archivo...',
        submessage: 'Preparando documento para procesamiento',
      };
    } else if (progress < 60) {
      return {
        message: 'Leyendo documento...',
        submessage: 'Accediendo al contenido del archivo',
      };
    } else if (progress < 90) {
      return {
        message: 'Extrayendo texto...',
        submessage: 'Procesando páginas del documento',
      };
    } else if (progress < 100) {
      return {
        message: 'Validando contenido...',
        submessage: 'Verificando texto extraído',
      };
    } else {
      return {
        message: '¡Listo!',
        submessage: 'Archivo procesado correctamente',
      };
    }
  };

  const handleAnalyze = async () => {
    if (!textoExtraido) return;
    
    setIsAnalyzing(true);
    setProgressMessage('Iniciando análisis...');
    
    try {
      const analisis = await analizarGuion(
        textoExtraido,
        (mensaje, intento) => {
          console.log(`[Intento ${intento}] ${mensaje}`);
          setProgressMessage(mensaje);
        }
      );

      console.log('Análisis completado:', analisis);
      
      toast({
        title: 'Análisis completado',
        description: `Se encontraron ${analisis.personajes.length} personajes y ${analisis.localizaciones.length} localizaciones`,
      });

      // Navegar a página de análisis con el resultado
      navigate('/analisis', { state: { analisis } });
      
    } catch (error) {
      console.error('Error al analizar:', error);
      
      const errorMessage = obtenerMensajeError(error);
      
      toast({
        title: 'Error al analizar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setProgressMessage('');
    }
  };

  const canAnalyze = archivo && textoExtraido && !isLoading && !error && !isAnalyzing;
  const progressMessages = getProgressMessage(progreso);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-2xl w-full border animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            🎬 App Desglose Cinematográfico
          </h1>
          <p className="text-muted-foreground">
            Análisis inteligente de guiones con IA
          </p>
        </div>

        {/* Área de upload / preview / loading */}
        <div className="mb-6">
          {isLoading && !archivo ? (
            <LoadingSpinner
              message={progressMessages.message}
              submessage={progressMessages.submessage}
              progress={progreso}
              size="lg"
            />
          ) : !archivo ? (
            <FileDropzone
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <FilePreview
              file={archivo}
              progreso={progreso}
              isLoading={isLoading}
              onRemove={resetUpload}
              extractedText={textoExtraido}
            />
          )}
        </div>

        {/* Botón de análisis */}
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          size="lg"
          className="w-full group relative overflow-hidden"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 animate-spin" />
              {progressMessage || 'Analizando con IA...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Analizar con IA
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>

        {/* Mensaje de ayuda */}
        {!archivo && (
          <div className="mt-6 p-4 rounded-lg bg-muted border">
            <p className="text-sm text-muted-foreground text-center">
              Sube tu guión en formato PDF o TXT para comenzar el análisis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
