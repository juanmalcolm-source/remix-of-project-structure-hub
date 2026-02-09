import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useLocationDistances,
  useSaveDistances,
} from '@/hooks/useLocations';
import { calcularMatrizDistancias } from '@/utils/haversine';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Plus, Trash2, Ruler, Navigation } from 'lucide-react';
import LocationDialog from '@/components/features/LocationDialog';
import type { LocationRow } from '@/hooks/useLocations';

export default function DesgloseLocalizacionesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: locations = [], isLoading: loadingLocs } = useLocations(projectId);
  const { data: distances = [] } = useLocationDistances(projectId);

  const createLoc = useCreateLocation();
  const updateLoc = useUpdateLocationMutation();
  const deleteLoc = useDeleteLocationMutation();
  const saveDistances = useSaveDistances();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocationRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = loadingProject || loadingLocs;

  // Count locations with GPS
  const withGps = locations.filter((l) => l.latitude != null && l.longitude != null);

  const handleSave = (data: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    production_notes: string | null;
    zone: string | null;
  }) => {
    if (!projectId) return;
    if (editingLoc) {
      updateLoc.mutate({ id: editingLoc.id, projectId, data });
    } else {
      createLoc.mutate({ ...data, project_id: projectId });
    }
    setEditingLoc(null);
  };

  const handleEdit = (loc: LocationRow) => {
    setEditingLoc(loc);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingLoc(null);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId && projectId) {
      deleteLoc.mutate({ id: deleteId, projectId });
      setDeleteId(null);
    }
  };

  const handleCalcDistances = () => {
    if (!projectId) return;
    const entries = calcularMatrizDistancias(locations);
    saveDistances.mutate({ projectId, entries });
  };

  // Build a lookup for distances
  const distLookup = useMemo(() => {
    const map = new Map<string, { km: number; min: number }>();
    for (const d of distances) {
      const key1 = `${d.from_location_id}_${d.to_location_id}`;
      const key2 = `${d.to_location_id}_${d.from_location_id}`;
      const val = { km: Number(d.distance_km) || 0, min: Number(d.duration_minutes) || 0 };
      map.set(key1, val);
      map.set(key2, val);
    }
    return map;
  }, [distances]);

  return (
    <ProductionLayout projectTitle={project?.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="section-header">
            <div className="section-header-icon">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Localizaciones</h2>
              <p className="text-sm text-muted-foreground">Gestión de localizaciones y distancias</p>
            </div>
          </div>
          <div className="flex gap-2">
            {withGps.length >= 2 && (
              <Button variant="outline" onClick={handleCalcDistances} disabled={saveDistances.isPending}>
                <Ruler className="w-4 h-4 mr-2" />
                Calcular distancias
              </Button>
            )}
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Localización
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MapPin className="w-4 h-4" /> Total
            </div>
            <p className="text-2xl font-bold">{locations.length}</p>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Navigation className="w-4 h-4" /> Con GPS
            </div>
            <p className="text-2xl font-bold">{withGps.length}</p>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Ruler className="w-4 h-4" /> Distancias
            </div>
            <p className="text-2xl font-bold">{distances.length}</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay localizaciones. Añade localizaciones manualmente o analiza un guión para generarlas automáticamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead className="w-28">GPS</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow
                    key={loc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEdit(loc)}
                  >
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell className="text-sm">{loc.address || '—'}</TableCell>
                    <TableCell>
                      {loc.zone ? (
                        <Badge variant="outline">{loc.zone}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {loc.latitude != null && loc.longitude != null ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          ✓ GPS
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin coords</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">
                      {loc.production_notes || '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(loc.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Distance Matrix */}
        {distances.length > 0 && withGps.length >= 2 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Matriz de Distancias
            </h3>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10">De / A</TableHead>
                    {withGps.map((loc) => (
                      <TableHead key={loc.id} className="text-center text-xs min-w-[100px]">
                        {loc.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withGps.map((from) => (
                    <TableRow key={from.id}>
                      <TableCell className="font-medium sticky left-0 bg-card text-sm">
                        {from.name}
                      </TableCell>
                      {withGps.map((to) => {
                        if (from.id === to.id) {
                          return (
                            <TableCell key={to.id} className="text-center bg-muted/30">—</TableCell>
                          );
                        }
                        const d = distLookup.get(`${from.id}_${to.id}`);
                        return (
                          <TableCell key={to.id} className="text-center text-xs">
                            {d ? (
                              <div>
                                <span className="font-mono font-semibold">{d.km} km</span>
                                <br />
                                <span className="text-muted-foreground">~{d.min} min</span>
                              </div>
                            ) : '—'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Location Dialog */}
      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editingLoc}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar localización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La localización será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProductionLayout>
  );
}
