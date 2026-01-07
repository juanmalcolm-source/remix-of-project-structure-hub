import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Percent, 
  AlertTriangle,
  Info,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject, useFinancingSources } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

export default function IntensidadPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: sources, isLoading: sourcesLoading } = useFinancingSources(projectId);

  const [investorCommission] = useState(15);

  // Calculate values from real data
  const calculations = useMemo(() => {
    const totalBudget = project?.financing_plan?.total_budget || 500000;
    const taxIncentive = project?.financing_plan?.tax_incentive_amount || 0;
    
    // Sum public aid from sources
    const publicAid = sources?.filter(s => 
      ['icaa_general', 'icaa_selectiva', 'autonomica'].includes(s.source_type || '')
    ).reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    const totalPublic = publicAid + taxIncentive;
    const intensity = (totalPublic / totalBudget) * 100;
    const intensityLimit = 50;
    const isOverLimit = intensity > intensityLimit;

    const grossIncentive = taxIncentive;
    const netIncentive = grossIncentive * (1 - investorCommission / 100);

    return {
      totalBudget,
      publicAid,
      taxIncentive,
      totalPublic,
      intensity,
      intensityLimit,
      isOverLimit,
      grossIncentive,
      netIncentive,
    };
  }, [project, sources, investorCommission]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const getIntensityColor = (value: number) => {
    if (value > calculations.intensityLimit) return 'text-red-600';
    if (value > calculations.intensityLimit * 0.9) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isLoading = projectLoading || sourcesLoading;

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
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

  return (
    <FinancingLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Main Intensity Card */}
        <Card className="border-2">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Calculadora de Intensidad Pública
            </CardTitle>
            <CardDescription>
              La intensidad pública es el porcentaje del presupuesto financiado con dinero público
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Visual Progress */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Intensidad actual</p>
                  <p className={`text-5xl font-bold ${getIntensityColor(calculations.intensity)}`}>
                    {calculations.intensity.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Límite legal</p>
                  <p className="text-2xl font-semibold">{calculations.intensityLimit}%</p>
                </div>
              </div>

              {/* Progress bar with limit marker */}
              <div className="relative">
                <Progress 
                  value={Math.min(calculations.intensity, 100)} 
                  className={`h-6 ${calculations.isOverLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
                />
                {/* Limit marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                  style={{ left: `${calculations.intensityLimit}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                    Límite
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Alert if over limit */}
            {calculations.isOverLimit && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Intensidad excedida</AlertTitle>
                <AlertDescription>
                  La intensidad pública supera el límite legal del {calculations.intensityLimit}%. 
                  Revisa las soluciones sugeridas abajo.
                </AlertDescription>
              </Alert>
            )}

            {!calculations.isOverLimit && calculations.intensity > calculations.intensityLimit * 0.9 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Cerca del límite</AlertTitle>
                <AlertDescription>
                  Estás al {((calculations.intensity / calculations.intensityLimit) * 100).toFixed(0)}% del límite permitido.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Aid breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desglose Financiación Pública</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span>Ayudas públicas (ICAA, autonómicas...)</span>
                <span className="font-semibold">{formatCurrency(calculations.publicAid)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Incentivos fiscales (bruto)</span>
                <span className="font-semibold">{formatCurrency(calculations.grossIncentive)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b text-muted-foreground">
                <span>Comisión inversor ({investorCommission}%)</span>
                <span>-{formatCurrency(calculations.grossIncentive - calculations.netIncentive)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Incentivos fiscales (neto)</span>
                <span className="font-semibold text-green-600">{formatCurrency(calculations.netIncentive)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg">
                <span>TOTAL PÚBLICO</span>
                <span className="text-primary">{formatCurrency(calculations.totalPublic)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Net vs Gross */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Incentivo Bruto vs Neto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span>Incentivo bruto</span>
                  <span className="font-semibold">{formatCurrency(calculations.grossIncentive)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Comisión inversor ({investorCommission}%)</span>
                  <span>-{formatCurrency(calculations.grossIncentive - calculations.netIncentive)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Incentivo neto (lo que recibes)</span>
                  <span className="text-green-600">{formatCurrency(calculations.netIncentive)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                El inversor que aporta el capital para monetizar la deducción cobra típicamente entre 15-17%.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Solutions if over limit */}
        {calculations.isOverLimit && (
          <Card className="border-yellow-500/50">
            <CardHeader className="bg-yellow-500/10">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="w-5 h-5" />
                Soluciones Sugeridas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Badge className="mb-2">Opción 1</Badge>
                  <h4 className="font-semibold">Reducir ayuda ICAA</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicitar {formatCurrency(calculations.publicAid - (calculations.totalBudget * calculations.intensityLimit / 100 - calculations.taxIncentive))} menos en ayudas
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Badge className="mb-2">Opción 2</Badge>
                  <h4 className="font-semibold">Aumentar presupuesto</h4>
                  <p className="text-sm text-muted-foreground">
                    Incrementar a {formatCurrency(calculations.totalPublic / (calculations.intensityLimit / 100))}
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Badge className="mb-2">Opción 3</Badge>
                  <h4 className="font-semibold">Clasificar como "difícil"</h4>
                  <p className="text-sm text-muted-foreground">
                    Si cumple criterios, el límite sube al 60%
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Badge className="mb-2">Opción 4</Badge>
                  <h4 className="font-semibold">Ver simulador</h4>
                  <p className="text-sm text-muted-foreground">
                    Prueba diferentes escenarios en el simulador "What If"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info card */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Límites de intensidad pública según normativa europea:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>50% para proyectos normales</li>
                  <li>60% para proyectos de difícil recuperación</li>
                  <li>80% para proyectos de muy difícil recuperación (documental, experimental...)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancingLayout>
  );
}