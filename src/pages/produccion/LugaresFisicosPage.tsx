import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MapPin, 
  Navigation, 
  Edit2, 
  Save, 
  X, 
  Plus,
  Map,
  Building2,
  TreePine,
  Home,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  Search
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  location_type: string | null;
  complexity: string | null;
  special_needs: string | null;
  estimated_days: number | null;
  production_notes: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  zone: string | null;
  place_id: string | null;
  formatted_address: string | null;
}

const ZONES = [
  { value: 'zona-norte', label: 'Zona Norte', color: 'bg-blue-500' },
  { value: 'zona-sur', label: 'Zona Sur', color: 'bg-green-500' },
  { value: 'zona-centro', label: 'Zona Centro', color: 'bg-orange-500' },
  { value: 'zona-este', label: 'Zona Este', color: 'bg-purple-500' },
  { value: 'zona-oeste', label: 'Zona Oeste', color: 'bg-pink-500' },
  { value: 'exterior-ciudad', label: 'Exterior Ciudad', color: 'bg-amber-500' },
  { value: 'estudio', label: 'Estudio/Plató', color: 'bg-cyan-500' },
];

const LOCATION_ICONS: Record<string, React.ReactNode> = {
  'interior': <Home className="w-4 h-4" />,
  'exterior': <TreePine className="w-4 h-4" />,
  'estudio': <Warehouse className="w-4 h-4" />,
  'urbano': <Building2 className="w-4 h-4" />,
};

export default function LugaresFisicosPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations-physical', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('project_id', projectId!)
        .order('name');
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!projectId
  });

  // Update location mutation
  const updateLocation = useMutation({
    mutationFn: async (location: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update({
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          zone: location.zone,
          production_notes: location.production_notes,
        })
        .eq('id', location.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-physical', projectId] });
      toast.success('Lugar físico actualizado');
      setIsDialogOpen(false);
      setEditingLocation(null);
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    }
  });

  const handleEditLocation = (location: Location) => {
    setEditingLocation({ ...location });
    setIsDialogOpen(true);
  };

  const handleSaveLocation = () => {
    if (!editingLocation) return;
    updateLocation.mutate(editingLocation);
  };

  const getLocationCompletionStatus = (location: Location) => {
    const hasAddress = !!location.address;
    const hasCoordinates = location.latitude !== null && location.longitude !== null;
    const hasZone = !!location.zone;
    
    if (hasAddress && hasCoordinates && hasZone) return 'complete';
    if (hasAddress || hasZone) return 'partial';
    return 'pending';
  };

  const getZoneInfo = (zoneValue: string | null) => {
    return ZONES.find(z => z.value === zoneValue);
  };

  const filteredLocations = locations?.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: locations?.length || 0,
    complete: locations?.filter(l => getLocationCompletionStatus(l) === 'complete').length || 0,
    partial: locations?.filter(l => getLocationCompletionStatus(l) === 'partial').length || 0,
    pending: locations?.filter(l => getLocationCompletionStatus(l) === 'pending').length || 0,
  };

  const groupedByZone = filteredLocations?.reduce((acc, loc) => {
    const zone = loc.zone || 'sin-zona';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  return (
    <ProductionLayout projectTitle={project?.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-orange-500" />
              Lugares Físicos de Rodaje
            </h1>
            <p className="text-muted-foreground mt-1">
              Define direcciones, coordenadas GPS y zonas para optimizar el plan de rodaje
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
                  <p className="text-xs text-muted-foreground">Completas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
                  <p className="text-xs text-muted-foreground">Parciales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Maps Integration Notice */}
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Map className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700 dark:text-blue-400">
                  Integración con Google Maps (Próximamente)
                </h3>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                  Cuando configures la API Key de Google Maps, podrás buscar direcciones con autocompletado, 
                  obtener coordenadas automáticamente y calcular distancias entre localizaciones.
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Places Autocomplete
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Geocoding
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Distance Matrix
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección o zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Locations by Zone */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando localizaciones...
          </div>
        ) : !locations?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No hay localizaciones</h3>
              <p className="text-sm text-muted-foreground">
                Primero analiza un guion para extraer las localizaciones
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByZone || {}).map(([zone, locs]) => {
              const zoneInfo = getZoneInfo(zone);
              return (
                <Card key={zone}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {zoneInfo ? (
                        <div className={`w-3 h-3 rounded-full ${zoneInfo.color}`} />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      )}
                      <CardTitle className="text-lg">
                        {zoneInfo?.label || 'Sin zona asignada'}
                      </CardTitle>
                      <Badge variant="secondary">{locs.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {locs.map((location) => {
                        const status = getLocationCompletionStatus(location);
                        return (
                          <div 
                            key={location.id}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            {/* Status indicator */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              status === 'complete' ? 'bg-green-500' :
                              status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              {LOCATION_ICONS[location.location_type || ''] || <MapPin className="w-5 h-5" />}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{location.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {location.location_type || 'Sin tipo'}
                                </Badge>
                              </div>
                              {location.address ? (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  📍 {location.address}
                                </p>
                              ) : (
                                <p className="text-sm text-amber-600 mt-1">
                                  ⚠️ Sin dirección definida
                                </p>
                              )}
                              {location.latitude && location.longitude && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLocation(location)}
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Editar Lugar Físico
              </DialogTitle>
              <DialogDescription>
                Define la dirección real, coordenadas GPS y zona de agrupación
              </DialogDescription>
            </DialogHeader>

            {editingLocation && (
              <div className="space-y-6 py-4">
                {/* Location name (read-only) */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-xs text-muted-foreground">Localización del guion</Label>
                  <p className="font-semibold text-lg">{editingLocation.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editingLocation.location_type} • {editingLocation.complexity || 'Sin complejidad'}
                  </p>
                </div>

                {/* Address input with future Google Maps placeholder */}
                <div className="space-y-2">
                  <Label>Dirección Física</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ej: Calle Mayor 15, Madrid, España"
                      value={editingLocation.address || ''}
                      onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                      className="pr-10"
                    />
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Con Google Maps API, podrás buscar con autocompletado
                  </p>
                </div>

                {/* GPS Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitud</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="40.416775"
                      value={editingLocation.latitude || ''}
                      onChange={(e) => setEditingLocation({ 
                        ...editingLocation, 
                        latitude: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitud</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="-3.703790"
                      value={editingLocation.longitude || ''}
                      onChange={(e) => setEditingLocation({ 
                        ...editingLocation, 
                        longitude: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                    />
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="h-48 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center">
                  <Map className="w-10 h-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Mapa interactivo disponible con Google Maps API
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Podrás hacer clic para seleccionar ubicación
                  </p>
                </div>

                {/* Zone selection */}
                <div className="space-y-2">
                  <Label>Zona de Agrupación</Label>
                  <Select
                    value={editingLocation.zone || ''}
                    onValueChange={(value) => setEditingLocation({ ...editingLocation, zone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${zone.color}`} />
                            {zone.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Las zonas se usan para agrupar localizaciones cercanas en el plan de rodaje
                  </p>
                </div>

                {/* Production notes */}
                <div className="space-y-2">
                  <Label>Notas de Producción</Label>
                  <Textarea
                    placeholder="Permisos necesarios, restricciones horarias, contacto del location manager..."
                    value={editingLocation.production_notes || ''}
                    onChange={(e) => setEditingLocation({ ...editingLocation, production_notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveLocation} disabled={updateLocation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateLocation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProductionLayout>
  );
}
