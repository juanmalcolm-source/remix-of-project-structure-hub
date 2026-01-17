import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Film, 
  Plus, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  MapPin,
  Users,
  Filter
} from "lucide-react";
import { SceneForPlanning, ProposedShootingDay } from "@/services/shootingPlanService";
import { cn } from "@/lib/utils";

interface UnassignedScenesPanelProps {
  sequences: any[];
  shootingDays: ProposedShootingDay[];
  locations: any[];
  onAssignToDay: (sequenceId: string, dayNumber: number) => void;
  onCreateDayWithScene: (sequenceId: string) => void;
}

const timeOfDayIcons: Record<string, React.ReactNode> = {
  'DÍA': <Sun className="h-3 w-3 text-amber-500" />,
  'NOCHE': <Moon className="h-3 w-3 text-indigo-400" />,
  'ATARDECER': <Sunset className="h-3 w-3 text-orange-500" />,
  'AMANECER': <Sunrise className="h-3 w-3 text-pink-400" />,
};

export function UnassignedScenesPanel({
  sequences,
  shootingDays,
  locations,
  onAssignToDay,
  onCreateDayWithScene,
}: UnassignedScenesPanelProps) {
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Calculate unassigned scenes
  const unassignedScenes = useMemo(() => {
    const assignedIds = new Set(
      shootingDays.flatMap(day => day.scenes.map((s: any) => s.id))
    );
    return sequences.filter(seq => !assignedIds.has(seq.id));
  }, [sequences, shootingDays]);

  // Apply filters
  const filteredScenes = useMemo(() => {
    return unassignedScenes.filter(scene => {
      if (locationFilter !== "all") {
        const locationMatch = scene.title?.toLowerCase().includes(locationFilter.toLowerCase()) ||
                             scene.description?.toLowerCase().includes(locationFilter.toLowerCase());
        if (!locationMatch) return false;
      }
      
      if (timeFilter !== "all") {
        const timeOfDay = scene.time_of_day || 
                         (scene.title?.toUpperCase().includes('NOCHE') ? 'NOCHE' : 'DÍA');
        if (timeOfDay !== timeFilter) return false;
      }
      
      return true;
    });
  }, [unassignedScenes, locationFilter, timeFilter]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    return locations.map(loc => loc.name);
  }, [locations]);

  const parseTimeOfDay = (scene: any): string => {
    if (scene.time_of_day) return scene.time_of_day;
    const title = scene.title?.toUpperCase() || '';
    if (title.includes('NOCHE')) return 'NOCHE';
    if (title.includes('ATARDECER')) return 'ATARDECER';
    if (title.includes('AMANECER')) return 'AMANECER';
    return 'DÍA';
  };

  if (unassignedScenes.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Film className="h-4 w-4" />
            Escenas sin asignar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Todas las escenas están asignadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Escenas sin asignar
          </span>
          <Badge variant="secondary">{unassignedScenes.length}</Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <MapPin className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Localización" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue placeholder="Hora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="DÍA">Día</SelectItem>
              <SelectItem value="NOCHE">Noche</SelectItem>
              <SelectItem value="ATARDECER">Atardecer</SelectItem>
              <SelectItem value="AMANECER">Amanecer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-2">
            {filteredScenes.map((scene) => {
              const timeOfDay = parseTimeOfDay(scene);
              const characters = Array.isArray(scene.characters_in_scene) 
                ? scene.characters_in_scene 
                : [];
              
              return (
                <div 
                  key={scene.id}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {scene.sequence_number}
                      </Badge>
                      <span className="flex items-center gap-1">
                        {timeOfDayIcons[timeOfDay]}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {scene.page_eighths || 1}/8
                    </Badge>
                  </div>
                  
                  <p className="text-xs truncate mb-2" title={scene.title}>
                    {scene.title || `Escena ${scene.sequence_number}`}
                  </p>
                  
                  {characters.length > 0 && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="truncate">
                        {characters.slice(0, 3).join(', ')}
                        {characters.length > 3 && ` +${characters.length - 3}`}
                      </span>
                    </div>
                  )}
                  
                  {/* Assignment options */}
                  <div className="flex gap-2 mt-2">
                    {shootingDays.length > 0 ? (
                      <Select 
                        onValueChange={(value) => {
                          if (value === 'new') {
                            onCreateDayWithScene(scene.id);
                          } else {
                            onAssignToDay(scene.id, parseInt(value));
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          <SelectValue placeholder="Asignar a..." />
                        </SelectTrigger>
                        <SelectContent>
                          {shootingDays.map(day => (
                            <SelectItem key={day.dayNumber} value={day.dayNumber.toString()}>
                              Día {day.dayNumber} - {day.location}
                            </SelectItem>
                          ))}
                          <SelectItem value="new" className="text-primary">
                            <Plus className="h-3 w-3 mr-1 inline" />
                            Crear nuevo día
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs w-full"
                        onClick={() => onCreateDayWithScene(scene.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear día
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredScenes.length === 0 && unassignedScenes.length > 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Filter className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No hay escenas con los filtros aplicados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
