import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Map, 
  Check,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface Territory {
  id: string;
  name: string;
  region: string;
  basePercentage: string;
  limit: string;
  bonuses: string[];
  specialFeatures: string[];
  sweetSpot: string;
  recommended: boolean;
}

const TERRITORIES: Territory[] = [
  {
    id: 'navarra',
    name: 'Navarra',
    region: 'Navarra',
    basePercentage: '45-50%',
    limit: '€5M',
    bonuses: ['+5% directoras', '+5% euskera', '+5% documentales'],
    specialFeatures: ['Film Commission activa', 'Proceso ágil'],
    sweetSpot: '€300K - €1M',
    recommended: false,
  },
  {
    id: 'bizkaia',
    name: 'País Vasco - Bizkaia',
    region: 'País Vasco',
    basePercentage: '35-60%',
    limit: 'SIN LÍMITE',
    bonuses: ['+10% euskera'],
    specialFeatures: ['Sin límite de deducción', 'Ideal para grandes producciones'],
    sweetSpot: '€1M+',
    recommended: true,
  },
  {
    id: 'alava-gipuzkoa',
    name: 'País Vasco - Álava/Gipuzkoa',
    region: 'País Vasco',
    basePercentage: '50-60%',
    limit: '€10M',
    bonuses: ['+10% euskera (hasta 70%)'],
    specialFeatures: ['Alto porcentaje base', 'Límite generoso'],
    sweetSpot: '€500K - €3M',
    recommended: false,
  },
  {
    id: 'canarias',
    name: 'Canarias',
    region: 'Canarias',
    basePercentage: '54% (1er M) + 45%',
    limit: '€36M',
    bonuses: ['IGIC 0%', 'ZEC 4% IS'],
    specialFeatures: ['Mejor clima de España', 'Infraestructura internacional', 'Sin IVA en servicios'],
    sweetSpot: '€500K - €5M',
    recommended: false,
  },
  {
    id: 'madrid',
    name: 'Madrid',
    region: 'Madrid',
    basePercentage: '30% (1er M) + 25%',
    limit: '€20M',
    bonuses: ['Film Madrid', 'Acceso a talento'],
    specialFeatures: ['Hub de la industria', 'Servicios completos', 'Facilidad logística'],
    sweetSpot: '€200K - €2M',
    recommended: false,
  },
];

export default function TerritoriosPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);

  const [budget, setBudget] = useState(500000);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  // Initialize from project data
  useMemo(() => {
    if (project?.financing_plan?.total_budget) {
      setBudget(project.financing_plan.total_budget);
    }
  }, [project]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  // Calculate incentive for each territory
  const calculateIncentive = (territoryId: string, budget: number): number => {
    switch (territoryId) {
      case 'navarra':
        return Math.min(budget * 0.45, 5000000);
      case 'bizkaia':
        return budget * 0.50;
      case 'alava-gipuzkoa':
        return Math.min(budget * 0.55, 10000000);
      case 'canarias':
        const firstMillion = Math.min(budget, 1000000) * 0.54;
        const rest = Math.max(0, budget - 1000000) * 0.45;
        return Math.min(firstMillion + rest, 36000000);
      case 'madrid':
        const firstMillionMadrid = Math.min(budget, 1000000) * 0.30;
        const restMadrid = Math.max(0, budget - 1000000) * 0.25;
        return Math.min(firstMillionMadrid + restMadrid, 20000000);
      default:
        return 0;
    }
  };

  // Find best territory
  const incentives = TERRITORIES.map(t => ({
    ...t,
    incentive: calculateIncentive(t.id, budget),
    percentage: (calculateIncentive(t.id, budget) / budget * 100).toFixed(1)
  })).sort((a, b) => b.incentive - a.incentive);

  const bestTerritory = incentives[0];

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      </FinancingLayout>
    );
  }

  if (!project) {
    return (
      <FinancingLayout projectTitle="Error">
        <div className="text-center py-12 text-muted-foreground">
          No se encontró el proyecto
        </div>
      </FinancingLayout>
    );
  }

  const projectTitle = project.title || 'Mi Proyecto';

  return (
    <FinancingLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Budget Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Comparador de Territorios
            </CardTitle>
            <CardDescription>
              Introduce tu presupuesto para ver el incentivo estimado en cada territorio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Presupuesto del proyecto</Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                  className="text-lg"
                />
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(budget)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Territory Highlight */}
        <Card className="border-2 border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mejor opción para tu presupuesto</p>
                  <p className="text-xl font-bold">{bestTerritory.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Incentivo estimado</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(bestTerritory.incentive)}</p>
                <p className="text-sm text-muted-foreground">{bestTerritory.percentage}% del presupuesto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativa Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Territorio</TableHead>
                  <TableHead>% Deducción</TableHead>
                  <TableHead>Límite</TableHead>
                  <TableHead className="text-right">Incentivo Estimado</TableHead>
                  <TableHead>Sweet Spot</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incentives.map((territory, index) => (
                  <TableRow 
                    key={territory.id}
                    className={`cursor-pointer ${selectedTerritory === territory.id ? 'bg-primary/10' : ''} ${index === 0 ? 'bg-green-500/5' : ''}`}
                    onClick={() => setSelectedTerritory(territory.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && <Badge className="bg-green-500">Mejor</Badge>}
                        <span className="font-medium">{territory.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{territory.basePercentage}</TableCell>
                    <TableCell>
                      {territory.limit === 'SIN LÍMITE' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {territory.limit}
                        </Badge>
                      ) : territory.limit}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(territory.incentive)}
                      <span className="text-xs text-muted-foreground ml-1">({territory.percentage}%)</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{territory.sweetSpot}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Ver detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Territory Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TERRITORIES.map((territory) => (
            <Card 
              key={territory.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTerritory === territory.id ? 'ring-2 ring-primary' : ''
              } ${territory.id === 'bizkaia' ? 'border-green-500/50' : ''}`}
              onClick={() => setSelectedTerritory(territory.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {territory.name}
                  {territory.id === 'bizkaia' && (
                    <Badge className="bg-green-500">Sin límite</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deducción</span>
                  <span className="font-semibold">{territory.basePercentage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Límite</span>
                  <span className={territory.limit === 'SIN LÍMITE' ? 'text-green-600 font-semibold' : ''}>
                    {territory.limit}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Bonificaciones:</p>
                  <div className="flex flex-wrap gap-1">
                    {territory.bonuses.map((bonus, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {bonus}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Características:</p>
                  <ul className="text-xs space-y-1">
                    {territory.specialFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FinancingLayout>
  );
}