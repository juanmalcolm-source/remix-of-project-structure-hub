import { useParams } from 'react-router-dom';
import { Target, TrendingUp, TrendingDown, DollarSign, Sparkles, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject } from '@/hooks/useProject';
import { Json } from '@/integrations/supabase/types';

function parseStringArray(data: Json | null | undefined): string[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter((item): item is string => typeof item === 'string');
}

export default function ViabilidadPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) return <CreativeLayout projectTitle="Cargando..."><PageSkeleton variant="overview" /></CreativeLayout>;
  if (error || !project) return <CreativeLayout projectTitle="Error"><ErrorState message="No se pudo cargar el proyecto" /></CreativeLayout>;

  const analysis = project.creative_analysis;
  const score = analysis?.producibility_score || 0;
  const positiveFactors = parseStringArray(analysis?.viability_factors_positive);
  const negativeFactors = parseStringArray(analysis?.viability_factors_negative);
  const budgetRange = analysis?.estimated_budget_range || 'No estimado';
  const characterCount = project.characters?.length || 0;
  const locationCount = project.locations?.length || 0;
  const mainCharacters = project.characters?.filter(c => c.category?.toLowerCase() === 'principal').length || 0;
  const complexLocations = project.locations?.filter(l => l.complexity === 'alta').length || 0;

  const getScoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-600' : 'text-red-600';
  const hasAnalysis = analysis && (score > 0 || positiveFactors.length > 0 || negativeFactors.length > 0);

  return (
    <CreativeLayout projectTitle={project.title}>
      <div className="space-y-6">
        <div className="flex items-center gap-3"><Target className="w-6 h-6" /><div><h2 className="text-2xl font-bold">Análisis de Viabilidad</h2><p className="text-muted-foreground">Evaluación de producibilidad del proyecto</p></div></div>

        {!hasAnalysis ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center"><Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Sin análisis de viabilidad</h3><p className="text-muted-foreground">Analiza un guión para obtener la puntuación de producibilidad.</p></CardContent></Card>
        ) : (
          <>
            <Card><CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-center"><div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div><p className="text-muted-foreground">/ 100</p><Badge variant="secondary" className="mt-2"><Sparkles className="w-3 h-3 mr-1" />IA</Badge></div>
                <div className="flex-1 space-y-2"><div className="flex justify-between text-sm"><span>Puntuación de Producibilidad</span><span className={getScoreColor(score)}>{score}%</span></div><Progress value={score} className="h-3" /><p className="text-sm text-muted-foreground mt-2">{score >= 70 ? 'Proyecto con alta viabilidad de producción' : score >= 40 ? 'Proyecto con viabilidad media' : 'Proyecto con desafíos significativos'}</p></div>
              </div>
            </CardContent></Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Rango Presupuesto</p><p className="font-semibold">{budgetRange}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Personajes Principales</p><p className="font-semibold">{mainCharacters} de {characterCount}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Localizaciones</p><p className="font-semibold">{locationCount}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Alta Complejidad</p><p className="font-semibold">{complexLocations} loc.</p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card><CardHeader className="bg-green-500/10"><CardTitle className="flex items-center gap-2 text-green-700"><TrendingUp className="w-5 h-5" />Factores Positivos ({positiveFactors.length})</CardTitle></CardHeader><CardContent className="pt-4">{positiveFactors.length > 0 ? <ul className="space-y-2">{positiveFactors.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span><span className="text-sm">{f}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No hay factores positivos identificados.</p>}</CardContent></Card>
              <Card><CardHeader className="bg-red-500/10"><CardTitle className="flex items-center gap-2 text-red-700"><TrendingDown className="w-5 h-5" />Factores Negativos ({negativeFactors.length})</CardTitle></CardHeader><CardContent className="pt-4">{negativeFactors.length > 0 ? <ul className="space-y-2">{negativeFactors.map((f, i) => <li key={i} className="flex items-start gap-2"><span className="text-red-500 mt-1">⚠</span><span className="text-sm">{f}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No hay factores negativos identificados.</p>}</CardContent></Card>
            </div>
          </>
        )}
      </div>
    </CreativeLayout>
  );
}
