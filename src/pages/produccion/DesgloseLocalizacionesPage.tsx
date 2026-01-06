import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Plus,
  Trash2,
  Sun,
  Moon,
  Building,
  Trees
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ProductionLocation {
  id: string;
  name: string;
  type: 'interior' | 'exterior' | 'mixto';
  complexity: 'baja' | 'media' | 'alta';
  estimatedDays: number;
  scenes: number;
  notes: string;
}

export default function DesgloseLocalizacionesPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [locations, setLocations] = useState<ProductionLocation[]>(
    analisis?.localizaciones.map((loc, i) => ({
      id: `loc-${i}`,
      name: loc.nombre,
      type: loc.tipo.toLowerCase().includes('int') ? 'interior' : loc.tipo.toLowerCase().includes('ext') ? 'exterior' : 'mixto',
      complexity: loc.complejidad.toLowerCase() as ProductionLocation['complexity'],
      estimatedDays: loc.dias_rodaje_estimados,
      scenes: loc.escenas.length,
      notes: loc.necesidades_especiales.join(', '),
    })) || [
      { id: '1', name: 'Apartamento protagonista', type: 'interior', complexity: 'baja', estimatedDays: 5, scenes: 12, notes: '' },
      { id: '2', name: 'Oficina central', type: 'interior', complexity: 'media', estimatedDays: 3, scenes: 8, notes: 'Necesita decoración de época' },
      { id: '3', name: 'Parque urbano', type: 'exterior', complexity: 'media', estimatedDays: 2, scenes: 4, notes: 'Permiso municipal requerido' },
    ]
  );

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const updateLocation = (id: string, field: keyof ProductionLocation, value: any) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  const addLocation = () => {
    const newLoc: ProductionLocation = {
      id: `loc-${Date.now()}`,
      name: 'Nueva localización',
      type: 'interior',
      complexity: 'media',
      estimatedDays: 1,
      scenes: 0,
      notes: '',
    };
    setLocations(prev => [...prev, newLoc]);
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
    toast({ title: 'Localización eliminada' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'interior': return <Building className="w-4 h-4" />;
      case 'exterior': return <Trees className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'baja': return 'bg-green-500/20 text-green-700';
      case 'media': return 'bg-yellow-500/20 text-yellow-700';
      case 'alta': return 'bg-red-500/20 text-red-700';
      default: return 'bg-muted';
    }
  };

  // Stats
  const interiorCount = locations.filter(l => l.type === 'interior').length;
  const exteriorCount = locations.filter(l => l.type === 'exterior').length;
  const totalDays = locations.reduce((sum, l) => sum + l.estimatedDays, 0);
  const totalScenes = locations.reduce((sum, l) => sum + l.scenes, 0);

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <ProductionLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{locations.length}</p>
              <p className="text-sm text-muted-foreground">Total Localizaciones</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Building className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{interiorCount}</p>
              <p className="text-sm text-muted-foreground">Interiores</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Trees className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold">{exteriorCount}</p>
              <p className="text-sm text-muted-foreground">Exteriores</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Sun className="w-8 h-8 mx-auto text-orange-600 mb-2" />
              <p className="text-2xl font-bold">{totalDays}</p>
              <p className="text-sm text-muted-foreground">Días estimados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Desglose de Localizaciones
              </span>
              <Button onClick={addLocation} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir localización
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Localización</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Complejidad</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead className="text-right">Escenas</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell>
                      <Input
                        value={loc.name}
                        onChange={(e) => updateLocation(loc.id, 'name', e.target.value)}
                        onBlur={handleSave}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={loc.type}
                        onValueChange={(value) => {
                          updateLocation(loc.id, 'type', value);
                          handleSave();
                        }}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interior">
                            <span className="flex items-center gap-2">
                              <Building className="w-3 h-3" /> INT
                            </span>
                          </SelectItem>
                          <SelectItem value="exterior">
                            <span className="flex items-center gap-2">
                              <Trees className="w-3 h-3" /> EXT
                            </span>
                          </SelectItem>
                          <SelectItem value="mixto">
                            <span className="flex items-center gap-2">
                              <Sun className="w-3 h-3" /> Mixto
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={loc.complexity}
                        onValueChange={(value) => {
                          updateLocation(loc.id, 'complexity', value);
                          handleSave();
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={loc.estimatedDays}
                        onChange={(e) => updateLocation(loc.id, 'estimatedDays', parseInt(e.target.value) || 0)}
                        onBlur={handleSave}
                        className="w-16 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={loc.scenes}
                        onChange={(e) => updateLocation(loc.id, 'scenes', parseInt(e.target.value) || 0)}
                        onBlur={handleSave}
                        className="w-16 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={loc.notes}
                        onChange={(e) => updateLocation(loc.id, 'notes', e.target.value)}
                        onBlur={handleSave}
                        placeholder="Notas de producción..."
                        className="min-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteLocation(loc.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Footer with totals */}
            <div className="flex justify-end mt-4 pt-4 border-t gap-8">
              <div className="text-center">
                <span className="text-sm text-muted-foreground">Total días:</span>
                <span className="text-xl font-bold ml-2">{totalDays}</span>
              </div>
              <div className="text-center">
                <span className="text-sm text-muted-foreground">Total escenas:</span>
                <span className="text-xl font-bold ml-2">{totalScenes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grouping suggestion */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Sugerencia:</strong> Agrupa las localizaciones cercanas para optimizar el plan de rodaje. 
              Las localizaciones exteriores dependen del clima - considera alternativas o días de reserva.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}
