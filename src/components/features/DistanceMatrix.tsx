import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  loadDistanceMatrix,
  saveDistanceEntry,
  autoCalculateDistances,
  groupLocationsByZone,
  calculateProximityScores,
  LocationWithCoords,
  DistanceEntry,
  ZoneGroup,
} from '@/services/distanceMatrixService';
import {
  Navigation,
  Calculator,
  Map as MapIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Route,
} from 'lucide-react';

interface DistanceMatrixProps {
  projectId: string;
}

export function DistanceMatrix({ projectId }: DistanceMatrixProps) {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ km: string; min: string }>({ km: '', min: '' });

  // Fetch locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations-with-coords', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, latitude, longitude, zone, address')
        .eq('project_id', projectId)
        .order('name');
      if (error) throw error;
      return data as LocationWithCoords[];
    },
    enabled: !!projectId,
  });

  // Fetch distance matrix
  const { data: distanceMatrix, isLoading: matrixLoading } = useQuery({
    queryKey: ['distance-matrix', projectId],
    queryFn: () => loadDistanceMatrix(projectId),
    enabled: !!projectId,
  });

  const distanceMap = distanceMatrix ?? new Map<string, DistanceEntry>();

  // Auto-calculate mutation
  const autoCalculateMutation = useMutation({
    mutationFn: () => autoCalculateDistances(projectId, locations),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['distance-matrix', projectId] });
      toast.success(`Calculadas ${result.calculated} distancias. ${result.skipped} localizaciones sin coordenadas.`);
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Save distance mutation
  const saveDistanceMutation = useMutation({
    mutationFn: (entry: DistanceEntry) => saveDistanceEntry(projectId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distance-matrix', projectId] });
      setEditingCell(null);
      toast.success('Distancia guardada');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });

  // Calculate zones and proximity
  const zoneGroups = useMemo(() => groupLocationsByZone(locations), [locations]);
  const proximityScores = useMemo(
    () => calculateProximityScores(locations, distanceMap),
    [locations, distanceMap]
  );

  // Stats
  const stats = useMemo(() => {
    const totalPairs = (locations.length * (locations.length - 1)) / 2;
    const coveredPairs = new Set<string>();
    
    distanceMap.forEach((_, key) => {
      const [from, to] = key.split('-');
      const sortedKey = [from, to].sort().join('-');
      coveredPairs.add(sortedKey);
    });
    
    const locationsWithCoords = locations.filter(l => l.latitude && l.longitude).length;
    
    return {
      totalLocations: locations.length,
      withCoordinates: locationsWithCoords,
      withoutCoordinates: locations.length - locationsWithCoords,
      totalPairs,
      coveredPairs: coveredPairs.size,
      coverage: totalPairs > 0 ? Math.round((coveredPairs.size / totalPairs) * 100) : 0,
    };
  }, [locations, distanceMap]);

  const handleCellClick = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const key = `${fromId}-${toId}`;
    const entry = distanceMap.get(key);
    
    setEditingCell(key);
    setEditValues({
      km: entry?.distance_km?.toString() || '',
      min: entry?.duration_minutes?.toString() || '',
    });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    
    const [fromId, toId] = editingCell.split('-');
    
    saveDistanceMutation.mutate({
      from_location_id: fromId,
      to_location_id: toId,
      distance_km: editValues.km ? parseFloat(editValues.km) : null,
      duration_minutes: editValues.min ? parseInt(editValues.min) : null,
      source: 'manual',
    });
  };

  const getDistanceValue = (fromId: string, toId: string): DistanceEntry | undefined => {
    const key = `${fromId}-${toId}`;
    return distanceMap.get(key);
  };

  const getCellColor = (entry: DistanceEntry | undefined): string => {
    if (!entry?.distance_km) return 'bg-muted/30';
    if (entry.distance_km < 5) return 'bg-green-500/20 text-green-700 dark:text-green-400';
    if (entry.distance_km < 15) return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
    return 'bg-red-500/20 text-red-700 dark:text-red-400';
  };

  if (locationsLoading || matrixLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando matriz de distancias...
      </div>
    );
  }

  if (locations.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Navigation className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Necesitas al menos 2 localizaciones</h3>
          <p className="text-sm text-muted-foreground">
            Añade localizaciones en la sección "Lugares Físicos" para calcular distancias
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLocations}</p>
                <p className="text-xs text-muted-foreground">Localizaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.withCoordinates}</p>
                <p className="text-xs text-muted-foreground">Con GPS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Route className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.coveredPairs}/{stats.totalPairs}</p>
                <p className="text-xs text-muted-foreground">Distancias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{zoneGroups.length}</p>
                <p className="text-xs text-muted-foreground">Zonas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => autoCalculateMutation.mutate()}
          disabled={autoCalculateMutation.isPending || stats.withCoordinates < 2}
        >
          <Calculator className="w-4 h-4 mr-2" />
          {autoCalculateMutation.isPending ? 'Calculando...' : 'Auto-calcular distancias (GPS)'}
        </Button>
        {stats.withoutCoordinates > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            {stats.withoutCoordinates} sin coordenadas
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Matriz de Distancias</TabsTrigger>
          <TabsTrigger value="zones">Agrupación por Zonas</TabsTrigger>
          <TabsTrigger value="proximity">Análisis de Proximidad</TabsTrigger>
        </TabsList>

        {/* Matrix Tab */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                Matriz de Distancias
              </CardTitle>
              <CardDescription>
                Haz clic en una celda para editar la distancia manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-background z-10">
                          Desde / Hasta
                        </th>
                        {locations.map((loc) => (
                          <th key={loc.id} className="p-2 text-center text-xs font-medium max-w-24">
                            <div className="truncate" title={loc.name}>
                              {loc.name.slice(0, 15)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((fromLoc) => (
                        <tr key={fromLoc.id}>
                          <td className="p-2 text-sm font-medium sticky left-0 bg-background z-10 max-w-32">
                            <div className="truncate" title={fromLoc.name}>
                              {fromLoc.name}
                            </div>
                          </td>
                          {locations.map((toLoc) => {
                            const key = `${fromLoc.id}-${toLoc.id}`;
                            const isEditing = editingCell === key;
                            const entry = getDistanceValue(fromLoc.id, toLoc.id);
                            const isDiagonal = fromLoc.id === toLoc.id;
                            
                            return (
                              <td
                                key={toLoc.id}
                                className={`p-1 text-center text-xs border ${
                                  isDiagonal
                                    ? 'bg-muted/50'
                                    : isEditing
                                    ? 'bg-primary/10'
                                    : getCellColor(entry) + ' cursor-pointer hover:ring-2 hover:ring-primary/50'
                                }`}
                                onClick={() => !isDiagonal && handleCellClick(fromLoc.id, toLoc.id)}
                              >
                                {isDiagonal ? (
                                  <span className="text-muted-foreground">—</span>
                                ) : isEditing ? (
                                  <div className="flex flex-col gap-1 p-1">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      placeholder="km"
                                      value={editValues.km}
                                      onChange={(e) => setEditValues({ ...editValues, km: e.target.value })}
                                      className="h-6 text-xs w-16"
                                      autoFocus
                                    />
                                    <Input
                                      type="number"
                                      placeholder="min"
                                      value={editValues.min}
                                      onChange={(e) => setEditValues({ ...editValues, min: e.target.value })}
                                      className="h-6 text-xs w-16"
                                    />
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={handleSaveCell}
                                      disabled={saveDistanceMutation.isPending}
                                    >
                                      OK
                                    </Button>
                                  </div>
                                ) : entry?.distance_km ? (
                                  <div className="min-w-16">
                                    <div className="font-medium">{entry.distance_km.toFixed(1)} km</div>
                                    {entry.duration_minutes && (
                                      <div className="text-muted-foreground">{entry.duration_minutes} min</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zoneGroups.map((group) => (
              <Card key={group.zone}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{group.zoneName}</CardTitle>
                    <Badge>{group.locations.length}</Badge>
                  </div>
                  {group.averageInternalDistance > 0 && (
                    <CardDescription>
                      Distancia media interna: {group.averageInternalDistance.toFixed(1)} km
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {group.locations.map((loc) => (
                      <li key={loc.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          loc.latitude && loc.longitude ? 'bg-green-500' : 'bg-amber-500'
                        }`} />
                        <span className="truncate">{loc.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Proximity Tab */}
        <TabsContent value="proximity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Análisis de Proximidad
              </CardTitle>
              <CardDescription>
                Localizaciones ordenadas por distancia media a las demás (útil para optimizar)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximityScores.map((score, index) => (
                  <div key={score.locationId} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{score.locationName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Distancia media: {score.averageDistanceToOthers.toFixed(1)} km
                      </p>
                      {score.nearestLocations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {score.nearestLocations.slice(0, 3).map((near) => (
                            <Badge key={near.id} variant="secondary" className="text-xs">
                              {near.name.slice(0, 20)}: {near.distance.toFixed(1)} km
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
