import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  Plus, 
  Edit2, 
  Trash2,
  Clock,
  FileText,
  Users,
  MapPin,
  Film,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface SinopsisData {
  logline: string;
  sinopsis_corta: string;
  sinopsis_pitch: string;
  versiones: Array<{
    fecha: string;
    logline: string;
    sinopsis_corta: string;
  }>;
}

interface CoreEmocional {
  tema_central: string;
  de_que_va_realmente: string;
  conflicto_central: string[];
  conflictos_secundarios: string[];
}

export default function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados editables
  const [sinopsis, setSinopsis] = useState<SinopsisData>({
    logline: 'Un [protagonista] debe [objetivo] mientras [obstáculo]',
    sinopsis_corta: 'Escribe aquí un resumen del guión en un párrafo...',
    sinopsis_pitch: 'Esta es la versión emocional que venderá tu historia...',
    versiones: []
  });

  const [coreEmocional, setCoreEmocional] = useState<CoreEmocional>({
    tema_central: '¿Cuál es el tema central de tu historia?',
    de_que_va_realmente: 'Más allá de la trama, ¿qué mensaje quieres transmitir?',
    conflicto_central: ['Interno: conflicto del protagonista', 'Externo: obstáculo principal'],
    conflictos_secundarios: []
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Auto-guardado cada 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingField) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [sinopsis, coreEmocional, editingField]);

  const handleAutoSave = () => {
    setIsSaving(true);
    // Aquí iría la llamada a la API para guardar
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({
        title: '✓ Guardado',
        duration: 1000,
      });
    }, 500);
  };

  const handleRegenerarSinopsis = async () => {
    setIsRegenerating(true);
    try {
      // Aquí iría la llamada a la IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Sinopsis regenerada',
        description: 'Se ha creado una nueva versión con IA',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo regenerar la sinopsis',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddVersion = () => {
    const nuevaVersion = {
      fecha: new Date().toISOString(),
      logline: sinopsis.logline,
      sinopsis_corta: sinopsis.sinopsis_corta,
    };
    setSinopsis(prev => ({
      ...prev,
      versiones: [...prev.versiones, nuevaVersion]
    }));
    toast({
      title: 'Versión guardada',
      description: 'Nueva versión añadida al historial',
    });
  };

  const handleAddConflictoSecundario = () => {
    setCoreEmocional(prev => ({
      ...prev,
      conflictos_secundarios: [...prev.conflictos_secundarios, 'Nuevo conflicto secundario']
    }));
  };

  const handleRemoveConflictoSecundario = (index: number) => {
    setCoreEmocional(prev => ({
      ...prev,
      conflictos_secundarios: prev.conflictos_secundarios.filter((_, i) => i !== index)
    }));
  };

  // Cálculo de Producibility Score
  const calcularProducibilityScore = () => {
    if (!analisis) return 50;
    
    let score = 100;
    
    // Penalización por complejidad
    if (analisis.resumen_produccion.complejidad_general === 'Alta') score -= 30;
    else if (analisis.resumen_produccion.complejidad_general === 'Media') score -= 15;
    
    // Penalización por localizaciones
    const totalLocs = analisis.localizaciones.length;
    if (totalLocs > 20) score -= 20;
    else if (totalLocs > 10) score -= 10;
    
    // Penalización por personajes
    const totalPersonajes = analisis.personajes.length;
    if (totalPersonajes > 30) score -= 15;
    else if (totalPersonajes > 15) score -= 7;
    
    return Math.max(0, Math.min(100, score));
  };

  const getPresupuestoEstimado = () => {
    if (!analisis) return '$50K - $200K';
    
    const score = calcularProducibilityScore();
    if (score >= 80) return '$50K - $200K';
    if (score >= 60) return '$200K - $500K';
    if (score >= 40) return '$500K - $1M';
    return '$1M+';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!analisis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Film className="w-16 h-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">No hay análisis disponible</h2>
            <p className="text-muted-foreground">
              Primero debes analizar un guión
            </p>
            <Button onClick={() => navigate('/upload')}>
              Analizar guión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const producibilityScore = calcularProducibilityScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {analisis.informacion_general.titulo}
              </h1>
              <p className="text-sm text-muted-foreground">
                Análisis Creativo • Overview del Proyecto
              </p>
            </div>
            
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Guardado {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Grid 2x2 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CARD 1: SINOPSIS */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Sinopsis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Logline */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Logline (1 frase gancho)
                </label>
                {editingField === 'logline' ? (
                  <Input
                    value={sinopsis.logline}
                    onChange={(e) => setSinopsis(prev => ({ ...prev, logline: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className="font-medium"
                  />
                ) : (
                  <p
                    className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative"
                    onClick={() => setEditingField('logline')}
                  >
                    {sinopsis.logline}
                    <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>

              {/* Sinopsis Corta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Sinopsis corta (1 párrafo)
                </label>
                {editingField === 'sinopsis_corta' ? (
                  <Textarea
                    value={sinopsis.sinopsis_corta}
                    onChange={(e) => setSinopsis(prev => ({ ...prev, sinopsis_corta: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={4}
                  />
                ) : (
                  <p
                    className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative text-sm"
                    onClick={() => setEditingField('sinopsis_corta')}
                  >
                    {sinopsis.sinopsis_corta}
                    <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>

              {/* Sinopsis Pitch */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Sinopsis pitch (versión emocional)
                </label>
                {editingField === 'sinopsis_pitch' ? (
                  <Textarea
                    value={sinopsis.sinopsis_pitch}
                    onChange={(e) => setSinopsis(prev => ({ ...prev, sinopsis_pitch: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={3}
                  />
                ) : (
                  <p
                    className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative text-sm italic"
                    onClick={() => setEditingField('sinopsis_pitch')}
                  >
                    {sinopsis.sinopsis_pitch}
                    <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerarSinopsis}
                  disabled={isRegenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isRegenerating ? 'Generando...' : 'Regenerar con IA'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddVersion}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir versión
                </Button>
              </div>

              {sinopsis.versiones.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    {sinopsis.versiones.length} versiones guardadas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 2: DATOS CLAVE */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Datos Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Film className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Género</p>
                    <p className="font-semibold">{analisis.informacion_general.genero}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="font-semibold">{analisis.informacion_general.duracion_estimada_minutos} min</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Páginas</p>
                    <p className="font-semibold">{analisis.informacion_general.paginas_totales}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Film className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Actos</p>
                    <p className="font-semibold">3</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Personajes</p>
                    <p className="font-semibold">{analisis.personajes.length}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localizaciones</p>
                    <p className="font-semibold">{analisis.localizaciones.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: CORE EMOCIONAL */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Core Emocional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Tema Central */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tema central
                </label>
                {editingField === 'tema_central' ? (
                  <Input
                    value={coreEmocional.tema_central}
                    onChange={(e) => setCoreEmocional(prev => ({ ...prev, tema_central: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                  />
                ) : (
                  <p
                    className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative"
                    onClick={() => setEditingField('tema_central')}
                  >
                    {coreEmocional.tema_central}
                    <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>

              {/* De qué va realmente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  De qué va realmente
                </label>
                {editingField === 'de_que_va' ? (
                  <Textarea
                    value={coreEmocional.de_que_va_realmente}
                    onChange={(e) => setCoreEmocional(prev => ({ ...prev, de_que_va_realmente: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    rows={3}
                  />
                ) : (
                  <p
                    className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative text-sm"
                    onClick={() => setEditingField('de_que_va')}
                  >
                    {coreEmocional.de_que_va_realmente}
                    <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>

              {/* Conflicto Central */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Conflicto central
                </label>
                <div className="space-y-1">
                  {coreEmocional.conflicto_central.map((conflicto, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {conflicto}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Conflictos Secundarios */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Conflictos secundarios
                </label>
                <div className="space-y-2">
                  {coreEmocional.conflictos_secundarios.map((conflicto, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <Input
                        value={conflicto}
                        onChange={(e) => {
                          const nuevos = [...coreEmocional.conflictos_secundarios];
                          nuevos[index] = e.target.value;
                          setCoreEmocional(prev => ({ ...prev, conflictos_secundarios: nuevos }));
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveConflictoSecundario(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddConflictoSecundario}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir conflicto secundario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4: PRODUCIBILITY SCORE */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Producibility Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Score con barra de progreso */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Viabilidad de Producción
                  </span>
                  <span className={`text-3xl font-bold ${getScoreColor(producibilityScore)}`}>
                    {producibilityScore}
                  </span>
                </div>
                <Progress value={producibilityScore} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Basado en complejidad, recursos y localizaciones
                </p>
              </div>

              {/* Presupuesto Estimado */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Presupuesto estimado</p>
                  <p className="text-xl font-bold">{getPresupuestoEstimado()}</p>
                </div>
              </div>

              {/* Complejidad */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Complejidad</p>
                  <Badge 
                    className={
                      analisis.resumen_produccion.complejidad_general === 'Baja' 
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : analisis.resumen_produccion.complejidad_general === 'Media'
                        ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400'
                    }
                  >
                    {analisis.resumen_produccion.complejidad_general}
                  </Badge>
                </div>
              </div>

              {/* Días de Rodaje */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Días de rodaje estimados</p>
                  <p className="text-xl font-bold">
                    {analisis.resumen_produccion.dias_rodaje.estimacion_recomendada} días
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rango: {analisis.resumen_produccion.dias_rodaje.estimacion_minima}-{analisis.resumen_produccion.dias_rodaje.estimacion_maxima} días
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Botón Flotante Siguiente */}
      <div className="fixed bottom-8 right-8 z-20">
        <Button
          size="lg"
          onClick={() => navigate('/analisis-narrativo', { state: { analisis } })}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          Siguiente: Análisis Narrativo
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
