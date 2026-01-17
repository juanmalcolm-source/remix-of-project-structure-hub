import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ProposedShootingDay } from "@/services/shootingPlanService";
import { cn } from "@/lib/utils";

interface ShootingDayCardProps {
  day: ProposedShootingDay;
  allDays: ProposedShootingDay[];
  maxEighths?: number;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSceneRemove?: (sceneId: string) => void;
  onSceneMove?: (sceneId: string, toDayNumber: number) => void;
  onUpdateDay?: (updates: Partial<ProposedShootingDay>) => void;
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

export function ShootingDayCard({
  day,
  allDays,
  maxEighths = 8,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSceneRemove,
  onSceneMove,
  onUpdateDay,
  isFirst,
  isLast,
}: ShootingDayCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const loadPercentage = (day.totalEighths / maxEighths) * 100;
  const isOverloaded = day.totalEighths > maxEighths;
  
  // Other days for moving scenes
  const otherDays = allDays.filter(d => d.dayNumber !== day.dayNumber);
  
  const handleTimeOfDayChange = (newTime: string) => {
    onUpdateDay?.({ timeOfDay: newTime });
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "transition-all",
        isOverloaded && "border-destructive/50 bg-destructive/5"
      )}>
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
                  <span className="font-medium">{day.location}</span>
                  
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
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {day.estimatedHours.toFixed(1)}h estimadas
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {day.characters.length} personajes
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Load indicator */}
              <div className="flex flex-col items-end gap-1 min-w-[100px]">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isOverloaded ? "text-destructive" : "text-foreground"
                  )}>
                    {day.totalEighths.toFixed(1)}/{maxEighths}
                  </span>
                  <span className="text-xs text-muted-foreground">octavos</span>
                </div>
                <Progress 
                  value={Math.min(loadPercentage, 100)} 
                  className={cn("h-2 w-24", isOverloaded && "[&>div]:bg-destructive")}
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
          {day.warnings.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
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
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
                  
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
                    <Badge variant="secondary" className="shrink-0">
                      {scene.page_eighths || scene.effectiveEighths || 1}/8
                    </Badge>
                    
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
              
              {day.scenes.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  No hay escenas asignadas a este día
                </div>
              )}
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
  );
}
