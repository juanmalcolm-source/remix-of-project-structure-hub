import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Pencil, 
  Clock, 
  FileText, 
  Users, 
  Camera, 
  Zap, 
  Baby, 
  Dog,
  Car,
  Lightbulb,
  Moon,
  Cloud,
  MessageSquare,
  Construction,
  Video,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Secuencia,
  FactoresComplejidad,
  AnalisisComplejidad,
  calcularScoreComplejidad,
  obtenerCategoriaComplejidad,
  crearFactoresVacios,
} from '@/types/analisisGuion';

interface ComplejidadEscenasProps {
  escenas: Secuencia[];
  onUpdateEscena?: (numeroSecuencia: number, analisis: AnalisisComplejidad) => void;
  readOnly?: boolean;
}

const factorConfig: { key: keyof FactoresComplejidad; label: string; icon: React.ReactNode; puntos: string }[] = [
  { key: 'movimiento_camara', label: 'Movimiento de cámara', icon: <Camera className="h-4 w-4" />, puntos: '+2' },
  { key: 'accion_fisica', label: 'Acción física', icon: <Zap className="h-4 w-4" />, puntos: '+3' },
  { key: 'stunts', label: 'Stunts/Coordinador', icon: <AlertTriangle className="h-4 w-4" />, puntos: '+10' },
  { key: 'efectos_especiales', label: 'Efectos especiales/VFX', icon: <Zap className="h-4 w-4" />, puntos: '+5' },
  { key: 'ninos', label: 'Niños menores de 16', icon: <Baby className="h-4 w-4" />, puntos: '+3' },
  { key: 'animales', label: 'Animales', icon: <Dog className="h-4 w-4" />, puntos: '+3' },
  { key: 'vehiculos_movimiento', label: 'Vehículos en movimiento', icon: <Car className="h-4 w-4" />, puntos: '+5' },
  { key: 'iluminacion_compleja', label: 'Iluminación compleja', icon: <Lightbulb className="h-4 w-4" />, puntos: '+2' },
  { key: 'escena_noche', label: 'Escena nocturna', icon: <Moon className="h-4 w-4" />, puntos: '+2' },
  { key: 'exteriores_clima', label: 'Exterior dependiente clima', icon: <Cloud className="h-4 w-4" />, puntos: '+2' },
  { key: 'dialogo_extenso', label: 'Diálogo extenso (+1 pág)', icon: <MessageSquare className="h-4 w-4" />, puntos: '+1' },
  { key: 'requiere_grua', label: 'Requiere grúa', icon: <Construction className="h-4 w-4" />, puntos: '+3' },
  { key: 'planos_especiales', label: 'Planos especiales (drone, steadicam)', icon: <Video className="h-4 w-4" />, puntos: '+2' },
];

const tipoEscenaOptions = [
  { value: 'dialogo_estatico', label: 'Diálogo estático', desc: 'Solo diálogos, cámara estática' },
  { value: 'movimiento', label: 'Movimiento', desc: 'Personajes en movimiento, seguimiento' },
  { value: 'accion', label: 'Acción', desc: 'Peleas ligeras, carreras, coordinación' },
  { value: 'intimista', label: 'Intimista', desc: 'Escenas íntimas, actuación sutil' },
  { value: 'accion_compleja', label: 'Acción compleja', desc: 'Stunts, efectos especiales, vehículos' },
] as const;

function getCategoriaColor(categoria: 'Baja' | 'Media' | 'Alta'): string {
  switch (categoria) {
    case 'Baja': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'Media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Alta': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
}

function getScoreColor(score: number): string {
  if (score < 10) return 'text-green-600 dark:text-green-400';
  if (score <= 25) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function ComplejidadEscenas({ escenas, onUpdateEscena, readOnly = false }: ComplejidadEscenasProps) {
  const [editingEscena, setEditingEscena] = useState<Secuencia | null>(null);
  const [editedFactores, setEditedFactores] = useState<FactoresComplejidad>(crearFactoresVacios());
  const [editedTipo, setEditedTipo] = useState<AnalisisComplejidad['tipo_escena']>('dialogo_estatico');
  const [expandedEscenas, setExpandedEscenas] = useState<Set<number>>(new Set());

  const handleOpenEdit = (escena: Secuencia) => {
    const analisis = escena.analisis_complejidad;
    setEditedFactores(analisis?.factores || crearFactoresVacios());
    setEditedTipo(analisis?.tipo_escena || 'dialogo_estatico');
    setEditingEscena(escena);
  };

  const handleSaveEdit = () => {
    if (!editingEscena || !onUpdateEscena) return;
    
    const score = calcularScoreComplejidad(editedFactores);
    const categoria = obtenerCategoriaComplejidad(score);
    
    // Calcular tiempo de setup basado en tipo escena
    const esExterior = editingEscena.set_type === 'EXT';
    const esNoche = editedFactores.escena_noche;
    let tiempoSetup = esExterior ? 60 : 45;
    if (esNoche) tiempoSetup += 15;
    
    // Calcular páginas por día sugerido
    let paginasDia = 5;
    if (categoria === 'Media') paginasDia = 3.5;
    if (categoria === 'Alta') paginasDia = 1.5;
    
    const nuevoAnalisis: AnalisisComplejidad = {
      tipo_escena: editedTipo,
      factores: editedFactores,
      score_complejidad: score,
      categoria,
      tiempo_setup_estimado_minutos: tiempoSetup,
      paginas_por_dia_sugerido: paginasDia,
    };
    
    onUpdateEscena(editingEscena.numero_secuencia, nuevoAnalisis);
    setEditingEscena(null);
  };

  const handleFactorChange = (key: keyof FactoresComplejidad, value: boolean | number) => {
    setEditedFactores(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleEscena = (numero: number) => {
    setExpandedEscenas(prev => {
      const next = new Set(prev);
      if (next.has(numero)) {
        next.delete(numero);
      } else {
        next.add(numero);
      }
      return next;
    });
  };

  // Calcular preview del score mientras edita
  const previewScore = calcularScoreComplejidad(editedFactores);
  const previewCategoria = obtenerCategoriaComplejidad(previewScore);

  // Agrupar escenas por categoría para estadísticas
  const stats = {
    baja: escenas.filter(e => e.analisis_complejidad?.categoria === 'Baja').length,
    media: escenas.filter(e => e.analisis_complejidad?.categoria === 'Media').length,
    alta: escenas.filter(e => e.analisis_complejidad?.categoria === 'Alta').length,
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Análisis de Complejidad por Escena
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Badge className="bg-green-500">{stats.baja}</Badge>
              <span className="text-sm">Complejidad Baja</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Badge className="bg-yellow-500">{stats.media}</Badge>
              <span className="text-sm">Complejidad Media</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Badge className="bg-red-500">{stats.alta}</Badge>
              <span className="text-sm">Complejidad Alta</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            El análisis de complejidad considera 15 factores de dificultad para estimar el tiempo de rodaje.
            {!readOnly && ' Puedes editar manualmente cada escena.'}
          </p>
        </CardContent>
      </Card>

      {/* Lista de escenas */}
      <div className="space-y-3">
        {escenas.map(escena => {
          const analisis = escena.analisis_complejidad;
          const isExpanded = expandedEscenas.has(escena.numero_secuencia);
          const factoresActivos = analisis ? Object.entries(analisis.factores).filter(([key, value]) => {
            if (typeof value === 'boolean') return value;
            if (typeof value === 'number' && key !== 'num_personajes') return value > 0;
            return false;
          }) : [];

          return (
            <Card key={escena.numero_secuencia} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleEscena(escena.numero_secuencia)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Escena {escena.numero_secuencia}</span>
                      <span className="text-muted-foreground text-sm">{escena.encabezado}</span>
                    </div>
                    
                    {/* Métricas rápidas */}
                    <div className="flex items-center gap-4 text-sm mt-2 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {escena.paginas_octavos} oct
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {escena.personajes?.length || 0} pers
                      </span>
                      {analisis && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Setup: {analisis.tiempo_setup_estimado_minutos}min
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Badge de complejidad */}
                    {analisis ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={cn('px-3 py-1', getCategoriaColor(analisis.categoria))}>
                              {analisis.categoria} - Score: {analisis.score_complejidad}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{analisis.paginas_por_dia_sugerido} págs/día sugerido</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline">Sin análisis</Badge>
                    )}
                    
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(escena);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Factores activos (siempre visible si hay) */}
                {factoresActivos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {factoresActivos.slice(0, isExpanded ? undefined : 5).map(([key]) => {
                      const config = factorConfig.find(f => f.key === key);
                      if (!config) return null;
                      return (
                        <Badge key={key} variant="secondary" className="text-xs flex items-center gap-1">
                          {config.icon}
                          {config.label}
                        </Badge>
                      );
                    })}
                    {!isExpanded && factoresActivos.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{factoresActivos.length - 5} más
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Contenido expandido */}
              {isExpanded && analisis && (
                <div className="border-t px-4 py-3 bg-muted/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo de escena:</span>
                      <p className="font-medium capitalize">{analisis.tipo_escena.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score:</span>
                      <p className={cn('font-bold', getScoreColor(analisis.score_complejidad))}>
                        {analisis.score_complejidad} puntos
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Setup estimado:</span>
                      <p className="font-medium">{analisis.tiempo_setup_estimado_minutos} min</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Páginas/día sugerido:</span>
                      <p className="font-medium">{analisis.paginas_por_dia_sugerido}</p>
                    </div>
                  </div>
                  
                  {analisis.factores.num_personajes > 0 && (
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Personajes en escena: </span>
                      <span className="font-medium">{analisis.factores.num_personajes}</span>
                      {analisis.factores.num_personajes > 2 && (
                        <span className="text-muted-foreground"> (+{analisis.factores.num_personajes - 2} puntos)</span>
                      )}
                    </div>
                  )}
                  
                  {analisis.factores.coordinacion_extras > 0 && (
                    <div className="mt-1 text-sm">
                      <span className="text-muted-foreground">Extras: </span>
                      <span className="font-medium">{analisis.factores.coordinacion_extras}</span>
                      <span className="text-muted-foreground"> (+{Math.floor(analisis.factores.coordinacion_extras / 5)} puntos)</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal de edición */}
      <Dialog open={!!editingEscena} onOpenChange={() => setEditingEscena(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Editar Complejidad - Escena {editingEscena?.numero_secuencia}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Tipo de escena */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Tipo de escena</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tipoEscenaOptions.map(option => (
                    <div
                      key={option.value}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        editedTipo === option.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setEditedTipo(option.value)}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Números */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="num_personajes" className="text-sm">
                    Número de personajes
                    <span className="text-muted-foreground ml-1">(+1 pt cada uno después de 2)</span>
                  </Label>
                  <Input
                    id="num_personajes"
                    type="number"
                    min={0}
                    max={50}
                    value={editedFactores.num_personajes}
                    onChange={(e) => handleFactorChange('num_personajes', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="coordinacion_extras" className="text-sm">
                    Número de extras
                    <span className="text-muted-foreground ml-1">(+1 pt cada 5)</span>
                  </Label>
                  <Input
                    id="coordinacion_extras"
                    type="number"
                    min={0}
                    max={500}
                    value={editedFactores.coordinacion_extras}
                    onChange={(e) => handleFactorChange('coordinacion_extras', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Factores booleanos */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Factores de complejidad</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {factorConfig.map(factor => (
                    <label
                      key={factor.key}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        (editedFactores[factor.key] as boolean)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={editedFactores[factor.key] as boolean}
                        onCheckedChange={(checked) => handleFactorChange(factor.key, !!checked)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {factor.icon}
                        <span className="text-sm">{factor.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {factor.puntos}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Preview del score */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score recalculado:</p>
                <p className={cn('text-2xl font-bold', getScoreColor(previewScore))}>
                  {previewScore} puntos
                </p>
              </div>
              <Badge className={cn('text-sm px-4 py-2', getCategoriaColor(previewCategoria))}>
                {previewCategoria}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEscena(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
