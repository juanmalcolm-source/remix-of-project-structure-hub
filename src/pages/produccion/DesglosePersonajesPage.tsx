import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductionCharacter {
  id: string;
  name: string;
  category: 'protagonista' | 'principal' | 'secundario' | 'figuracion';
  shootingDays: number;
  dailyRate: number;
  agencyPercentage: number;
  total: number;
}

export default function DesglosePersonajesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading } = useProject(projectId);

  const [characters, setCharacters] = useState<ProductionCharacter[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize characters from project data
  useEffect(() => {
    if (project?.characters && project.characters.length > 0) {
      const mappedCharacters = project.characters.map((char) => {
        const cat = (char.category?.toLowerCase() || 'secundario') as ProductionCharacter['category'];
        const dailyRate = char.daily_rate || (cat === 'protagonista' ? 2000 : cat === 'principal' ? 1200 : cat === 'secundario' ? 600 : 150);
        const shootingDays = char.shooting_days || 0;
        const agencyPercentage = char.agency_percentage || 15;
        
        return {
          id: char.id,
          name: char.name,
          category: cat,
          shootingDays,
          dailyRate,
          agencyPercentage,
          total: shootingDays * dailyRate * (1 + agencyPercentage / 100),
        };
      });
      setCharacters(mappedCharacters);
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

  const updateCharacter = (id: string, field: keyof ProductionCharacter, value: number | string) => {
    setCharacters(prev => prev.map(char => {
      if (char.id !== id) return char;
      
      const updated = { ...char, [field]: value };
      updated.total = updated.shootingDays * updated.dailyRate * (1 + updated.agencyPercentage / 100);
      return updated;
    }));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'protagonista': return 'bg-primary/20 text-primary';
      case 'principal': return 'bg-blue-500/20 text-blue-700';
      case 'secundario': return 'bg-yellow-500/20 text-yellow-700';
      case 'figuracion': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (isLoading) {
    return (
      <ProductionLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}
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

  // Calculate totals by category
  const totalsByCategory = characters.reduce((acc, char) => {
    acc[char.category] = (acc[char.category] || 0) + char.total;
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = characters.reduce((sum, char) => sum + char.total, 0);
  const projectTitle = project.title || 'Mi Proyecto';

  return (
    <ProductionLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{characters.length}</p>
              <p className="text-sm text-muted-foreground">Total Personajes</p>
            </CardContent>
          </Card>
          
          {['protagonista', 'principal', 'secundario', 'figuracion'].map(cat => (
            <Card key={cat}>
              <CardContent className="pt-6 text-center">
                <Badge className={`${getCategoryColor(cat)} mb-2`}>{cat}</Badge>
                <p className="text-lg font-bold">{formatCurrency(totalsByCategory[cat] || 0)}</p>
                <p className="text-xs text-muted-foreground">
                  {characters.filter(c => c.category === cat).length} personajes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Desglose de Personal Artístico
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="text-xl font-bold">{formatCurrency(grandTotal)}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {characters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay personajes. El análisis del guión generará esta información automáticamente.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personaje</TableHead>
                    <TableHead>Categoría ICAA</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">Tarifa/día</TableHead>
                    <TableHead className="text-right">Agencia %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((char) => (
                    <TableRow key={char.id}>
                      <TableCell className="font-medium">{char.name}</TableCell>
                      <TableCell>
                        <Select 
                          value={char.category}
                          onValueChange={(value) => {
                            updateCharacter(char.id, 'category', value);
                            handleSave();
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="protagonista">Protagonista</SelectItem>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="secundario">Secundario</SelectItem>
                            <SelectItem value="figuracion">Figuración</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={char.shootingDays}
                          onChange={(e) => updateCharacter(char.id, 'shootingDays', parseInt(e.target.value) || 0)}
                          onBlur={handleSave}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={char.dailyRate}
                          onChange={(e) => updateCharacter(char.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                          onBlur={handleSave}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={char.agencyPercentage}
                          onChange={(e) => updateCharacter(char.id, 'agencyPercentage', parseFloat(e.target.value) || 0)}
                          onBlur={handleSave}
                          className="w-20 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(char.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Footer with Grand Total */}
            {characters.length > 0 && (
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-medium">TOTAL PERSONAL ARTÍSTICO:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Los datos se importan automáticamente desde la Parte Creativa. 
              Las tarifas y porcentajes de agencia son editables. El total se calcula como: 
              Días × Tarifa × (1 + Agencia%).
            </p>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}