import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FlaskConical, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface Scenario {
  budget: number;
  territory: string;
  directorFemale: boolean;
  isDebut: boolean;
  euskera: boolean;
}

export default function SimuladorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading } = useProject(projectId);

  // Base scenario
  const [baseScenario, setBaseScenario] = useState<Scenario>({
    budget: 500000,
    territory: 'madrid',
    directorFemale: false,
    isDebut: false,
    euskera: false,
  });

  // Comparison scenario
  const [compareScenario, setCompareScenario] = useState<Scenario>({
    budget: 500000,
    territory: 'navarra',
    directorFemale: true,
    isDebut: false,
    euskera: false,
  });

  // Initialize from project data
  useMemo(() => {
    if (project?.financing_plan) {
      const fp = project.financing_plan;
      const initialScenario = {
        budget: fp.total_budget || 500000,
        territory: fp.shooting_territory || 'madrid',
        directorFemale: fp.director_gender === 'female',
        isDebut: fp.is_debut || false,
        euskera: false,
      };
      setBaseScenario(initialScenario);
    }
  }, [project]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  // Calculate incentive based on scenario
  const calculateIncentive = (scenario: Scenario): { incentive: number; bonuses: string[]; icaaPoints: number } => {
    let baseRate = 0;
    let limit = Infinity;
    const bonuses: string[] = [];
    let icaaPoints = 0;

    switch (scenario.territory) {
      case 'navarra':
        baseRate = 0.45;
        limit = 5000000;
        if (scenario.directorFemale) { baseRate += 0.05; bonuses.push('+5% directora'); }
        if (scenario.euskera) { baseRate += 0.05; bonuses.push('+5% euskera'); }
        break;
      case 'bizkaia':
        baseRate = 0.50;
        limit = Infinity;
        if (scenario.euskera) { baseRate += 0.10; bonuses.push('+10% euskera'); }
        break;
      case 'alava-gipuzkoa':
        baseRate = 0.55;
        limit = 10000000;
        if (scenario.euskera) { baseRate += 0.10; bonuses.push('+10% euskera'); }
        break;
      case 'canarias':
        const firstM = Math.min(scenario.budget, 1000000) * 0.54;
        const rest = Math.max(0, scenario.budget - 1000000) * 0.45;
        return { 
          incentive: Math.min(firstM + rest, 36000000), 
          bonuses: ['IGIC 0%', 'ZEC 4%'], 
          icaaPoints 
        };
      case 'madrid':
        const firstMMad = Math.min(scenario.budget, 1000000) * 0.30;
        const restMad = Math.max(0, scenario.budget - 1000000) * 0.25;
        return { 
          incentive: Math.min(firstMMad + restMad, 20000000), 
          bonuses: [], 
          icaaPoints 
        };
      default:
        baseRate = 0.25;
    }

    // ICAA points calculation
    if (scenario.directorFemale) icaaPoints += 10;
    if (scenario.isDebut) icaaPoints += 10;

    const incentive = Math.min(scenario.budget * baseRate, limit);
    return { incentive, bonuses, icaaPoints };
  };

  const baseResult = useMemo(() => calculateIncentive(baseScenario), [baseScenario]);
  const compareResult = useMemo(() => calculateIncentive(compareScenario), [compareScenario]);
  const difference = compareResult.incentive - baseResult.incentive;

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-32 mx-auto max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-96" />)}
          </div>
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

  const renderScenarioCard = (
    scenario: Scenario, 
    setScenario: (s: Scenario) => void, 
    title: string,
    isBase: boolean
  ) => (
    <Card className={isBase ? '' : 'border-primary'}>
      <CardHeader className={isBase ? 'bg-muted/50' : 'bg-primary/10'}>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label>Presupuesto</Label>
          <Input
            type="number"
            value={scenario.budget}
            onChange={(e) => setScenario({ ...scenario, budget: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Territorio</Label>
          <Select 
            value={scenario.territory}
            onValueChange={(v) => setScenario({ ...scenario, territory: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="navarra">Navarra</SelectItem>
              <SelectItem value="bizkaia">País Vasco - Bizkaia</SelectItem>
              <SelectItem value="alava-gipuzkoa">País Vasco - Álava/Gipuzkoa</SelectItem>
              <SelectItem value="canarias">Canarias</SelectItem>
              <SelectItem value="madrid">Madrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Directora mujer</Label>
          <Switch 
            checked={scenario.directorFemale}
            onCheckedChange={(v) => setScenario({ ...scenario, directorFemale: v })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Ópera prima</Label>
          <Switch 
            checked={scenario.isDebut}
            onCheckedChange={(v) => setScenario({ ...scenario, isDebut: v })}
          />
        </div>

        {(scenario.territory === 'navarra' || scenario.territory.includes('bizkaia') || scenario.territory.includes('alava')) && (
          <div className="flex items-center justify-between">
            <Label>Proyecto en euskera</Label>
            <Switch 
              checked={scenario.euskera}
              onCheckedChange={(v) => setScenario({ ...scenario, euskera: v })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResultCard = (result: { incentive: number; bonuses: string[]; icaaPoints: number }, isBase: boolean) => (
    <Card className={isBase ? 'bg-muted/30' : 'bg-primary/5 border-primary'}>
      <CardContent className="pt-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Incentivo fiscal estimado</p>
        <p className={`text-3xl font-bold ${isBase ? '' : 'text-primary'}`}>
          {formatCurrency(result.incentive)}
        </p>
        
        {result.bonuses.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-3">
            {result.bonuses.map((b, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
            ))}
          </div>
        )}

        {result.icaaPoints > 0 && (
          <p className="text-sm text-green-600 mt-2">
            +{result.icaaPoints} puntos ICAA
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <FinancingLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <FlaskConical className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Simulador "What If"</h2>
          <p className="text-muted-foreground">
            Compara diferentes escenarios y ve cómo afectan a tu financiación
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Base Scenario */}
          <div className="space-y-4">
            {renderScenarioCard(baseScenario, setBaseScenario, 'Escenario Base', true)}
            {renderResultCard(baseResult, true)}
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center">
            <ArrowRight className="w-12 h-12 text-muted-foreground hidden md:block" />
            
            {/* Difference Card */}
            <Card className={`mt-4 ${difference > 0 ? 'bg-green-500/10 border-green-500' : difference < 0 ? 'bg-red-500/10 border-red-500' : ''}`}>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Diferencia</p>
                <div className="flex items-center justify-center gap-2">
                  {difference > 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : difference < 0 ? (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  ) : null}
                  <p className={`text-2xl font-bold ${
                    difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : ''
                  }`}>
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {difference > 0 ? 'El escenario alternativo es mejor' : 
                   difference < 0 ? 'El escenario base es mejor' : 'Sin diferencia'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Compare Scenario */}
          <div className="space-y-4">
            {renderScenarioCard(compareScenario, setCompareScenario, 'Escenario Alternativo', false)}
            {renderResultCard(compareResult, false)}
          </div>
        </div>

        {/* Quick Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Escenarios Rápidos
            </CardTitle>
            <CardDescription>
              Prueba estos escenarios con un clic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  directorFemale: true
                })}
              >
                ¿Y si la directora es mujer?
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  territory: 'bizkaia'
                })}
              >
                ¿Y si ruedo en Bizkaia?
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  budget: baseScenario.budget * 1.5
                })}
              >
                ¿Y si aumento +50% presupuesto?
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  territory: 'canarias'
                })}
              >
                ¿Y si ruedo en Canarias?
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  isDebut: true
                })}
              >
                ¿Y si es ópera prima?
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareScenario({
                  ...baseScenario,
                  territory: 'navarra',
                  euskera: true
                })}
              >
                ¿Y si proyecto en euskera?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancingLayout>
  );
}