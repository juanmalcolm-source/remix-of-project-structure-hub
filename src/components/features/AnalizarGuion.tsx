import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, RefreshCw, FileQuestion, Clock, Scissors, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { analizarGuion, obtenerMensajeError, AnalisisError } from '@/services/analisisService';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface AnalizarGuionProps {
  textoGuion: string;
  onAnalisisCompleto: (analisis: AnalisisGuion) => void;
}

interface EtapaAnalisis {
  mensaje: string;
  duracion: number;
}

const ETAPAS_ANALISIS: EtapaAnalisis[] = [
  { mensaje: "Preparando análisis...", duracion: 2000 },
  { mensaje: "Analizando estructura narrativa...", duracion: 5000 },
  { mensaje: "Identificando personajes...", duracion: 8000 },
  { mensaje: "Detectando localizaciones...", duracion: 6000 },
  { mensaje: "Desglosando secuencias...", duracion: 10000 },
  { mensaje: "Calculando días de rodaje...", duracion: 4000 },
  { mensaje: "Generando resumen...", duracion: 3000 },
  { mensaje: "Finalizando...", duracion: 2000 }
];

export default function AnalizarGuion({ textoGuion, onAnalisisCompleto }: AnalizarGuionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensajeActual, setMensajeActual] = useState('');
  const [error, setError] = useState<AnalisisError | null>(null);
  const [intentoActual, setIntentoActual] = useState(0);

  // Simular progreso realista durante el análisis
  useEffect(() => {
    if (!isAnalyzing) {
      setProgreso(0);
      setMensajeActual('');
      return;
    }

    const duracionTotal = ETAPAS_ANALISIS.reduce((sum, etapa) => sum + etapa.duracion, 0);
    let tiempoTranscurrido = 0;
    let etapaActual = 0;
    let tiempoEtapaActual = 0;

    const interval = setInterval(() => {
      tiempoTranscurrido += 100; // Actualizar cada 100ms
      tiempoEtapaActual += 100;

      // Calcular etapa actual
      let acumulado = 0;
      for (let i = 0; i < ETAPAS_ANALISIS.length; i++) {
        acumulado += ETAPAS_ANALISIS[i].duracion;
        if (tiempoTranscurrido <= acumulado) {
          if (etapaActual !== i) {
            etapaActual = i;
            tiempoEtapaActual = 0;
            setMensajeActual(ETAPAS_ANALISIS[i].mensaje);
          }
          break;
        }
      }

      // Calcular progreso global (0-95% durante etapas, 100% al completar)
      const progresoGlobal = Math.min((tiempoTranscurrido / duracionTotal) * 95, 95);
      setProgreso(Math.round(progresoGlobal));
    }, 100);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalizar = async () => {
    if (!textoGuion || textoGuion.trim().length === 0) {
      setError(new AnalisisError(
        'No hay texto del guión para analizar',
        'VALIDATION'
      ));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgreso(0);
    setMensajeActual('Iniciando análisis...');

    try {
      const analisis = await analizarGuion(
        textoGuion,
        (mensaje, intento) => {
          console.log(`[Intento ${intento}] ${mensaje}`);
          setIntentoActual(intento);
          
          // Si hay reintentos, actualizar el mensaje
          if (intento > 1) {
            setMensajeActual(`Reintentando... (${intento}/3)`);
          }
        }
      );

      // Completar progreso
      setProgreso(100);
      setMensajeActual('¡Análisis completado!');

      // Esperar un momento antes de notificar
      setTimeout(() => {
        onAnalisisCompleto(analisis);
        setIsAnalyzing(false);
      }, 500);

    } catch (err) {
      console.error('Error al analizar:', err);
      
      // Guardar el error completo si es AnalisisError, sino crear uno nuevo
      if (err instanceof AnalisisError) {
        setError(err);
      } else {
        setError(new AnalisisError(
          obtenerMensajeError(err),
          'API_ERROR',
          err
        ));
      }
      
      setIsAnalyzing(false);
      setProgreso(0);
    }
  };

  const handleReintentar = () => {
    setError(null);
    setIntentoActual(0);
    handleAnalizar();
  };

  return (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-6">
        {/* Icono animado */}
        <div className={`relative ${isAnalyzing ? 'animate-pulse' : ''}`}>
          {isAnalyzing ? (
            <div className="relative">
              <Sparkles className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
          ) : error ? (
            <AlertCircle className="w-16 h-16 text-destructive" />
          ) : (
            <Sparkles className="w-16 h-16 text-primary" />
          )}
        </div>

        {/* Título y descripción */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            {error ? 'Error al analizar' : isAnalyzing ? 'Analizando guión' : 'Análisis con IA'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {error 
              ? 'Hubo un problema durante el análisis' 
              : isAnalyzing 
                ? 'Este proceso puede tardar unos momentos' 
                : 'Claude Sonnet 4.5 analizará tu guión y generará un desglose completo de producción'}
          </p>
        </div>

        {/* Progreso */}
        {isAnalyzing && (
          <div className="w-full space-y-3">
            <Progress value={progreso} className="h-2" />
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground animate-pulse">
                {mensajeActual}
              </p>
              {intentoActual > 1 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Intento {intentoActual}/3
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de error detallado */}
        {error && (
          <Alert variant="destructive" className="w-full">
            <div className="flex items-start gap-3">
              {error.code === 'GUION_MUY_LARGO' && <FileQuestion className="w-5 h-5 mt-0.5" />}
              {error.code === 'TIMEOUT' && <Clock className="w-5 h-5 mt-0.5" />}
              {error.code === 'GUION_MAL_FORMATEADO' && <Scissors className="w-5 h-5 mt-0.5" />}
              {error.code === 'JSON_INVALIDO' && <MessageSquare className="w-5 h-5 mt-0.5" />}
              {!['GUION_MUY_LARGO', 'TIMEOUT', 'GUION_MAL_FORMATEADO', 'JSON_INVALIDO', 'RATE_LIMIT', 'PAYMENT_REQUIRED', 'API_ERROR', 'NETWORK_ERROR', 'VALIDATION'].includes(error.code) && (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              )}
              {['RATE_LIMIT', 'PAYMENT_REQUIRED', 'API_ERROR', 'NETWORK_ERROR', 'VALIDATION'].includes(error.code) && (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="text-sm font-medium">
                  {error.message}
                </AlertDescription>
                {error.metadata?.sugerencia && (
                  <AlertDescription className="text-xs text-muted-foreground">
                    💡 {error.metadata.sugerencia}
                  </AlertDescription>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Botones */}
        <div className="w-full space-y-2">
          {!isAnalyzing && !error && (
            <Button
              onClick={handleAnalizar}
              size="lg"
              className="w-full group"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Analizar con IA
            </Button>
          )}

          {error && (
            <div className="w-full space-y-2">
              <Button
                onClick={handleReintentar}
                size="lg"
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                {error.metadata?.accion || 'Reintentar análisis'}
              </Button>
              
              {error.code === 'GUION_MUY_LARGO' && error.metadata?.accionSecundaria && (
                <Button
                  onClick={() => {
                    // Analizar solo las primeras 100 páginas (aproximadamente 60,000 caracteres)
                    const textoReducido = textoGuion.slice(0, 60000);
                    handleAnalizar();
                  }}
                  size="lg"
                  className="w-full"
                  variant="outline"
                >
                  <Scissors className="w-5 h-5 mr-2" />
                  {error.metadata.accionSecundaria}
                </Button>
              )}
            </div>
          )}

          {isAnalyzing && (
            <Button
              disabled
              size="lg"
              className="w-full cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Analizando...
            </Button>
          )}
        </div>

        {/* Información adicional */}
        {!isAnalyzing && !error && (
          <div className="w-full p-4 rounded-lg bg-muted border text-center">
            <p className="text-xs text-muted-foreground">
              El análisis extrae personajes, localizaciones, attrezzo, vestuario y calcula días de rodaje estimados
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
