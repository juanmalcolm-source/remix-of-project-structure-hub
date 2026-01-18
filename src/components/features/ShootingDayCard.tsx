import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  GripVertical, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  ArrowRight,
  X,
  MoreVertical,
  Edit2,
  Check,
  Film,
  Wrench,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  ProposedShootingDay, 
  calculateSceneShootingTimeDetailed,
  calculateDayTimeWithLocationOptimization,
  MAX_WORKDAY_HOURS,
} from "@/services/shootingPlanService";
import { useDragDrop, DraggedScene } from "@/contexts/DragDropContext";
import { cn } from "@/lib/utils";

interface ShootingDayCardProps {
  day: ProposedShootingDay;
  allDays: ProposedShootingDay[];
  maxEighthsPerDay?: number; // Octavos máximos por día (estándar profesional: 32 = 4 páginas)
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSceneRemove?: (sceneId: string) => void;
  onSceneMove?: (sceneId: string, toDayNumber: number) => void;
  onUpdateDay?: (updates: Partial<ProposedShootingDay>) => void;
  onSceneDrop?: (sceneId: string, fromDayNumber?: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const timeOfDayIcons: Record<string, React.ReactNode> = {
  'DÍA': <Sun className="h-4 w-4 text-amber-500" />,
  'NOCHE': <Moon className="h-4 w-4 text-indigo-400" />,
  'ATARDECER': <Sunset className="h-4 w-4 text-orange-500" />,
  'AMANECER': <Sunrise className="h-4 w-4 text-pink-400" />,
  'MIXTO': <Sun className="h-4 w-4 text-muted-foreground" />,
};

const timeOptions = ['DÍA', 'NOCHE', 'ATARDECER', 'AMANECER'];

// Colores para multiplicadores de complejidad
const complexityColors: Record<number, string> = {
  1.0: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  1.2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  2.0: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  3.0: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Formatear octavos en formato profesional de producción
function formatEighths(eighths: number): string {
  if (!eighths || eighths <= 0) return '1/8';
  if (eighths < 8) {
    return `${eighths}/8`;
  }
  const pages = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  if (remainder === 0) {
    return `${pages} pág`;
  }
  return `${pages} ${remainder}/8`;
}

// Formatear minutos en formato legible
function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function ShootingDayCard({
  day,
  allDays,
  maxEighthsPerDay = 32, // 4 páginas/día = estándar profesional
  onDelete,
  onMoveUp,
  onMoveDown,
  onSceneRemove,
  onSceneMove,
  onUpdateDay,
  onSceneDrop,
  isFirst,
  isLast,
}: ShootingDayCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editedLocation, setEditedLocation] = useState(day.location);
  
  const { draggedScene, startDrag, endDrag } = useDragDrop();
  
  // Calcular tiempos con optimización por localización
  const dayTimeBreakdown = calculateDayTimeWithLocationOptimization(day.scenes);
  const totalHours = dayTimeBreakdown.totalHours;
  const isOverworked = totalHours > MAX_WORKDAY_HOURS;
  
  // Calcular carga en páginas
  const loadPercentage = Math.min((day.totalEighths / maxEighthsPerDay) * 100, 100);
  const isOverloaded = day.totalEighths > maxEighthsPerDay;
  const pagesLoaded = (day.totalEighths / 8).toFixed(1);
  const maxPages = (maxEighthsPerDay / 8).toFixed(0);
  
  // Other days for moving scenes
  const otherDays = allDays.filter(d => d.dayNumber !== day.dayNumber);
  
  const handleTimeOfDayChange = (newTime: string) => {
    onUpdateDay?.({ timeOfDay: newTime });
  };

  const handleLocationSave = () => {
    if (editedLocation.trim() && editedLocation !== day.location) {
      onUpdateDay?.({ location: editedLocation.trim() });
    }
    setIsEditingLocation(false);
  };

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLocationSave();
    } else if (e.key === 'Escape') {
      setEditedLocation(day.location);
      setIsEditingLocation(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedScene && draggedScene.fromDayNumber !== day.dayNumber) {
      onSceneDrop?.(draggedScene.id, draggedScene.fromDayNumber);
    }
    endDrag();
  };

  const handleSceneDragStart = (e: React.DragEvent, scene: any) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', scene.id);
    
    startDrag({
      id: scene.id,
      sequence_number: scene.sequence_number,
      title: scene.title,
      page_eighths: scene.page_eighths || 1,
      effectiveEighths: scene.effectiveEighths,
      characters: scene.characters || [],
      fromDayNumber: day.dayNumber,
    });
  };

  const handleSceneDragEnd = () => {
    endDrag();
  };
  
  return (
    <TooltipProvider>
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={cn(
          "transition-all",
          (isOverloaded || isOverworked) && "border-destructive/50 bg-destructive/5",
          isDragOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 min-w-[60px]">
                <span className="text-xs text-muted-foreground">DÍA</span>
                <span className="text-2xl font-bold text-primary">{day.dayNumber}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  
                  {/* Editable location */}
                  {isEditingLocation ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        onKeyDown={handleLocationKeyDown}
                        onBlur={handleLocationSave}
                        className="h-7 w-48 text-sm"
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={handleLocationSave}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span 
                      className="font-medium cursor-pointer hover:underline flex items-center gap-1 group"
                      onClick={() => setIsEditingLocation(true)}
                    >
                      {day.location}
                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  )}
                  
                  {/* Time of day selector */}
                  <Select value={day.timeOfDay} onValueChange={handleTimeOfDayChange}>
                    <SelectTrigger className="h-7 w-auto gap-1 border-none bg-muted/50 hover:bg-muted">
                      {timeOfDayIcons[day.timeOfDay] || timeOfDayIcons['MIXTO']}
                      <span className="text-sm">{day.timeOfDay}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          <span className="flex items-center gap-2">
                            {timeOfDayIcons[time]}
                            {time}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "flex items-center gap-1 cursor-help",
                        isOverworked && "text-destructive font-medium"
                      )}>
                        <Clock className="h-3 w-3" />
                        {totalHours.toFixed(1)}h jornada
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3 text-blue-500" />
                          <span>Setup: {formatMinutes(dayTimeBreakdown.totalSetupMinutes)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Film className="h-3 w-3 text-green-500" />
                          <span>Rodaje: {formatMinutes(dayTimeBreakdown.totalShootingMinutes)}</span>
                        </div>
                        <div className="border-t pt-1 mt-1 font-medium">
                          Total: {formatMinutes(dayTimeBreakdown.totalMinutes)}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {day.characters.length} personajes
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Load indicator - en páginas */}
              <div className="flex flex-col items-end gap-1 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isOverloaded ? "text-destructive" : "text-foreground"
                  )}>
                    {pagesLoaded}/{maxPages} pág
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({day.totalEighths.toFixed(0)} oct)
                  </span>
                </div>
                <Progress 
                  value={loadPercentage} 
                  className={cn("h-2 w-28", isOverloaded && "[&>div]:bg-destructive")}
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 ml-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onMoveUp} 
                  disabled={isFirst}
                  className="h-8 w-8"
                  title="Mover día arriba"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onMoveDown} 
                  disabled={isLast}
                  className="h-8 w-8"
                  title="Mover día abajo"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="Eliminar día"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {(day.warnings.length > 0 || isOverworked) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {isOverworked && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  ¡Jornada de {totalHours.toFixed(1)}h! Máximo recomendado: {MAX_WORKDAY_HOURS}h
                </Badge>
              )}
              {day.warnings.map((warning, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {warning}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Scenes list */}
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Escenas ({day.scenes.length})
              </h4>
              
              {day.scenes.map((scene, index) => (
                <div 
                  key={scene.id || index}
                  draggable
                  onDragStart={(e) => handleSceneDragStart(e, scene)}
                  onDragEnd={handleSceneDragEnd}
                  className={cn(
                    "flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group cursor-grab active:cursor-grabbing",
                    "border-2 border-transparent hover:border-primary/20"
                  )}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0">
                        Esc. {scene.sequence_number}
                      </Badge>
                      <span className="text-sm truncate">{scene.title}</span>
                    </div>
                    
                    {scene.characters && scene.characters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scene.characters.slice(0, 5).map((char, i) => (
                          <span key={i} className="text-xs text-muted-foreground">
                            {char}{i < Math.min(scene.characters.length - 1, 4) ? ',' : ''}
                          </span>
                        ))}
                        {scene.characters.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{scene.characters.length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {formatEighths(scene.page_eighths || scene.effectiveEighths || 1)}
                    </Badge>
                    
                    {/* Tiempo desglosado */}
                    {(() => {
                      const breakdown = calculateSceneShootingTimeDetailed(scene);
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="shrink-0 text-xs cursor-help">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatMinutes(breakdown.totalMinutes)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-3 w-3 text-blue-500" />
                                <span>Setup: {breakdown.setupMinutes}m</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Film className="h-3 w-3 text-green-500" />
                                <span>Rodaje: {breakdown.shootingMinutes}m</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                    
                    {/* Multiplicador de complejidad */}
                    {(() => {
                      const breakdown = calculateSceneShootingTimeDetailed(scene);
                      const factor = breakdown.complexityFactor;
                      const colorClass = complexityColors[factor] || complexityColors[1.2];
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={cn("shrink-0 text-xs cursor-help", colorClass)}>
                              ×{factor}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{scene.complexity_reason || 'Complejidad estándar'}</span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                    
                    {/* Scene actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {otherDays.length > 0 && (
                          <>
                            {otherDays.map(targetDay => (
                              <DropdownMenuItem 
                                key={targetDay.dayNumber}
                                onClick={() => onSceneMove?.(scene.id, targetDay.dayNumber)}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Mover a Día {targetDay.dayNumber}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => onSceneRemove?.(scene.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Quitar del día
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {/* Drop zone when empty or for adding more */}
              <div 
                className={cn(
                  "text-center py-4 text-muted-foreground text-sm border-2 border-dashed rounded-lg transition-colors",
                  isDragOver && "border-primary bg-primary/10 text-primary",
                  day.scenes.length === 0 && "py-8"
                )}
              >
                {day.scenes.length === 0 
                  ? (isDragOver ? "Suelta aquí para añadir" : "Arrastra escenas aquí o usa el panel lateral")
                  : (isDragOver ? "Suelta para añadir escena" : "Arrastra más escenas aquí")
                }
              </div>
            </div>
            
            {/* Characters */}
            {day.characters.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Personajes en este día
                </h4>
                <div className="flex flex-wrap gap-2">
                  {day.characters.map((char, i) => (
                    <Badge key={i} variant="outline">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
    </TooltipProvider>
  );
}
