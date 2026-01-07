import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Plus,
  Trash2,
  Users,
  MapPin,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface ShootingDay {
  id: string;
  dayNumber: number;
  date: string;
  location: string;
  scenes: string[];
  characters: string[];
  notes: string;
}

export default function PlanRodajePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading } = useProject(projectId);

  const [shootingDays, setShootingDays] = useState<ShootingDay[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize shooting days from project data
  useEffect(() => {
    if (project?.locations && project.locations.length > 0) {
      const totalDays = project.locations.reduce((sum, loc) => sum + (loc.estimated_days || 1), 0);
      const daysToCreate = Math.min(totalDays, 10); // Limit initial days
      
      const initialDays = Array.from({ length: daysToCreate }, (_, i) => ({
        id: `day-${i}`,
        dayNumber: i + 1,
        date: '',
        location: project.locations[i % project.locations.length]?.name || `Localización ${i + 1}`,
        scenes: [],
        characters: project.characters?.slice(0, 3).map(c => c.name) || [],
        notes: '',
      }));
      setShootingDays(initialDays);
    }
  }, [project]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const updateDay = (id: string, field: keyof ShootingDay, value: unknown) => {
    setShootingDays(prev => prev.map(day => 
      day.id === id ? { ...day, [field]: value } : day
    ));
  };

  const addDay = () => {
    const newDay: ShootingDay = {
      id: `day-${Date.now()}`,
      dayNumber: shootingDays.length + 1,
      date: '',
      location: 'Nueva localización',
      scenes: [],
      characters: [],
      notes: '',
    };
    setShootingDays(prev => [...prev, newDay]);
  };

  const deleteDay = (id: string) => {
    setShootingDays(prev => {
      const filtered = prev.filter(day => day.id !== id);
      return filtered.map((day, i) => ({ ...day, dayNumber: i + 1 }));
    });
    toast({ title: 'Día eliminado' });
  };

  const moveDay = (id: string, direction: 'up' | 'down') => {
    const index = shootingDays.findIndex(d => d.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === shootingDays.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newDays = [...shootingDays];
    [newDays[index], newDays[newIndex]] = [newDays[newIndex], newDays[index]];
    
    setShootingDays(newDays.map((day, i) => ({ ...day, dayNumber: i + 1 })));
    handleSave();
  };

  if (isLoading) {
    return (
      <ProductionLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ProductionLayout>
    );
  }

  if (!project) {
    return (
      <ProductionLayout projectTitle="Error">
        <div className="text-center py-12 text-muted-foreground">
          No se encontró el proyecto
        </div>
      </ProductionLayout>
    );
  }

  const availableLocations = project.locations?.map(l => l.name) || [];
  const estimatedDays = project.locations?.reduce((sum, loc) => sum + (loc.estimated_days || 1), 0) || 20;
  const projectTitle = project.title || 'Mi Proyecto';

  return (
    <ProductionLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{shootingDays.length}</p>
              <p className="text-sm text-muted-foreground">Días planificados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{estimatedDays}</p>
              <p className="text-sm text-muted-foreground">Días estimados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {shootingDays.reduce((sum, d) => sum + d.scenes.length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Escenas asignadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {new Set(shootingDays.map(d => d.location)).size}
              </p>
              <p className="text-sm text-muted-foreground">Localizaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Shooting Days */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Plan de Rodaje
              </span>
              <Button onClick={addDay} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir día
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {shootingDays.map((day, index) => (
                <div 
                  key={day.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Day number and controls */}
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveDay(day.id, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{day.dayNumber}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveDay(day.id, 'down')}
                        disabled={index === shootingDays.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Day content */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Date */}
                      <div>
                        <label className="text-xs text-muted-foreground">Fecha</label>
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(e) => updateDay(day.id, 'date', e.target.value)}
                          onBlur={handleSave}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Localización
                        </label>
                        <Select 
                          value={day.location}
                          onValueChange={(value) => {
                            updateDay(day.id, 'location', value);
                            handleSave();
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLocations.length > 0 ? (
                              availableLocations.map((loc, i) => (
                                <SelectItem key={i} value={loc}>{loc}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="sin-localizaciones">Sin localizaciones</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Scenes */}
                      <div>
                        <label className="text-xs text-muted-foreground">Escenas</label>
                        <Input
                          value={day.scenes.join(', ')}
                          onChange={(e) => updateDay(day.id, 'scenes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          onBlur={handleSave}
                          placeholder="Esc. 1, Esc. 2..."
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-muted-foreground">Notas</label>
                        <Input
                          value={day.notes}
                          onChange={(e) => updateDay(day.id, 'notes', e.target.value)}
                          onBlur={handleSave}
                          placeholder="Notas del día..."
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteDay(day.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Characters for this day */}
                  <div className="mt-3 ml-16 flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {day.characters.map((char, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                      {day.characters.length === 0 && (
                        <span className="text-xs text-muted-foreground">Sin personajes asignados</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {shootingDays.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No hay días de rodaje. Haz clic en "Añadir día" para empezar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Consejo:</strong> Agrupa escenas por localización para minimizar desplazamientos. 
              Ordena los días según la disponibilidad de actores principales y las condiciones de luz.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}