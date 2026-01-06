import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Gauge, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ViabilityFactor {
  id: string;
  text: string;
  impact: 'high' | 'medium' | 'low';
}

export default function ViabilidadPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [positiveFactors, setPositiveFactors] = useState<ViabilityFactor[]>([
    { id: '1', text: 'Mayoría de localizaciones interiores', impact: 'high' },
    { id: '2', text: 'Sin efectos especiales complejos', impact: 'high' },
    { id: '3', text: 'Elenco reducido', impact: 'medium' },
    { id: '4', text: 'Sin escenas nocturnas', impact: 'low' },
  ]);

  const [negativeFactors, setNegativeFactors] = useState<ViabilityFactor[]>([
    { id: '1', text: 'Necesidad de permisos municipales', impact: 'medium' },
    { id: '2', text: 'Escenas con animales', impact: 'high' },
    { id: '3', text: 'Vestuario de época', impact: 'medium' },
  ]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate producibility score
  const producibilityScore = analisis 
    ? Math.max(0, Math.min(100, 
        100 
        - (analisis.localizaciones.length > 20 ? 20 : analisis.localizaciones.length > 10 ? 10 : 0)
        - (analisis.personajes.length > 30 ? 15 : analisis.personajes.length > 15 ? 7 : 0)
        - (analisis.resumen_produccion.complejidad_general === 'Alta' ? 30 : 
           analisis.resumen_produccion.complejidad_general === 'Media' ? 15 : 0)
      ))
    : 65;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Alta viabilidad';
    if (score >= 60) return 'Viabilidad media';
    if (score >= 40) return 'Viabilidad baja';
    return 'Proyecto complejo';
  };

  const getEstimatedBudget = (score: number) => {
    if (score >= 80) return { min: '€50.000', max: '€200.000', label: 'Bajo presupuesto' };
    if (score >= 60) return { min: '€200.000', max: '€500.000', label: 'Presupuesto medio' };
    if (score >= 40) return { min: '€500.000', max: '€1.000.000', label: 'Presupuesto alto' };
    return { min: '€1.000.000', max: '€3.000.000+', label: 'Gran producción' };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-700';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700';
      case 'low': return 'bg-green-500/20 text-green-700';
      default: return 'bg-muted';
    }
  };

  const budget = getEstimatedBudget(producibilityScore);
  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  // Stats for breakdown chart
  const breakdownStats = [
    { label: 'Personajes', value: analisis?.personajes.length || 12, icon: Users, color: 'bg-blue-500' },
    { label: 'Localizaciones', value: analisis?.localizaciones.length || 8, icon: MapPin, color: 'bg-green-500' },
    { label: 'Días Rodaje', value: analisis?.resumen_produccion.dias_rodaje.estimacion_recomendada || 20, icon: Gauge, color: 'bg-purple-500' },
  ];

  return (
    <CreativeLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Main Score Card */}
        <Card className="border-2">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Producibility Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score */}
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(producibilityScore)}`}>
                  {producibilityScore}
                </div>
                <p className="text-sm text-muted-foreground mt-1">de 100</p>
                <Badge className="mt-2" variant="outline">
                  {getScoreLabel(producibilityScore)}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="flex items-center">
                <Progress value={producibilityScore} className="h-4" />
              </div>

              {/* Budget estimate */}
              <div className="text-center border-l pl-6">
                <DollarSign className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{budget.min} - {budget.max}</p>
                <p className="text-sm text-muted-foreground">{budget.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Positive Factors */}
          <Card>
            <CardHeader className="bg-green-500/10">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                Factores que Facilitan ({positiveFactors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {positiveFactors.map((factor) => (
                  <div 
                    key={factor.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="flex-1 text-sm">{factor.text}</span>
                    <Badge className={getImpactColor(factor.impact)}>
                      {factor.impact === 'high' ? 'Alto' : factor.impact === 'medium' ? 'Medio' : 'Bajo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Negative Factors */}
          <Card>
            <CardHeader className="bg-red-500/10">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <TrendingDown className="w-5 h-5" />
                Factores que Encarecen ({negativeFactors.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {negativeFactors.map((factor) => (
                  <div 
                    key={factor.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="flex-1 text-sm">{factor.text}</span>
                    <Badge className={getImpactColor(factor.impact)}>
                      {factor.impact === 'high' ? 'Alto' : factor.impact === 'medium' ? 'Medio' : 'Bajo'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Chart */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Desglose Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {breakdownStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full ${stat.color}/20 flex items-center justify-center mb-3`}>
                      <Icon className={`w-8 h-8 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Recalcular con nuevos datos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreativeLayout>
  );
}
