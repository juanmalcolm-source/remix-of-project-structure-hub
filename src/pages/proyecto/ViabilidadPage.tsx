import { useParams } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  Users,
  MapPin,
  Shield,
  Lightbulb,
  AlertTriangle,
  Trophy,
  Globe,
  Film,
  Tv,
  Star,
} from 'lucide-react';
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

interface DAFOElement {
  titulo: string;
  descripcion: string;
  impacto: string;
  categoria: string;
}

interface DAFOAnalysis {
  fortalezas: DAFOElement[];
  debilidades: DAFOElement[];
  oportunidades: DAFOElement[];
  amenazas: DAFOElement[];
  score_narrativo: number;
  score_comercial: number;
  score_festival: number;
  recomendacion_general: string;
}

interface MarketPotential {
  territorios_principales: string[];
  genero_tendencia: string;
  ventanas_distribucion: string[];
  festivales_sugeridos: string[];
  plataformas_potenciales: string[];
}

function parseJsonObject<T>(data: Json | null | undefined): T | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as T;
}

function ScoreGauge({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) {
  const getColor = (s: number) => {
    if (s >= 70) return { text: 'text-green-600', bg: 'from-green-400 to-green-600' };
    if (s >= 40) return { text: 'text-amber-600', bg: 'from-amber-400 to-amber-600' };
    return { text: 'text-red-600', bg: 'from-red-400 to-red-600' };
  };
  const colors = getColor(score);

  return (
    <div className="text-center space-y-2">
      <Icon className="w-5 h-5 mx-auto text-muted-foreground" />
      <div className={`text-3xl font-bold ${colors.text}`}>{score}</div>
      <Progress value={score} className="h-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

const impactColors: Record<string, string> = {
  alto: 'border-l-4 border-l-red-500',
  medio: 'border-l-4 border-l-amber-500',
  bajo: 'border-l-4 border-l-blue-500',
};

const categoryBadges: Record<string, string> = {
  narrativa: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  produccion: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  mercado: 'bg-green-500/10 text-green-700 dark:text-green-400',
  audiencia: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

const trendLabels: Record<string, { label: string; color: string }> = {
  en_alza: { label: 'En alza', color: 'text-green-600' },
  estable: { label: 'Estable', color: 'text-amber-600' },
  en_baja: { label: 'En baja', color: 'text-red-600' },
};

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

  const dafoAnalysis = parseJsonObject<DAFOAnalysis>(analysis?.dafo_analysis);
  const marketPotential = parseJsonObject<MarketPotential>(analysis?.market_potential);

  // Scores from DAFO or individual columns
  const scoreNarrativo = (analysis?.score_narrativo as number) || dafoAnalysis?.score_narrativo || 0;
  const scoreComercial = (analysis?.score_comercial as number) || dafoAnalysis?.score_comercial || 0;
  const scoreFestival = (analysis?.score_festival as number) || dafoAnalysis?.score_festival || 0;

  const getScoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-600' : 'text-red-600';
  const hasAnalysis = analysis && (score > 0 || positiveFactors.length > 0 || negativeFactors.length > 0);
  const hasDAFO = dafoAnalysis && (dafoAnalysis.fortalezas?.length > 0 || dafoAnalysis.debilidades?.length > 0);
  const hasScores = scoreNarrativo > 0 || scoreComercial > 0 || scoreFestival > 0;

  return (
    <CreativeLayout projectTitle={project.title}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">Análisis de Viabilidad</h2>
            <p className="text-muted-foreground">Producibilidad, DAFO y potencial de mercado</p>
          </div>
        </div>

        {!hasAnalysis && !hasDAFO ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin análisis de viabilidad</h3>
              <p className="text-muted-foreground">Analiza un guión para obtener la evaluación completa.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ═══ 3 SCORES ═══ */}
            {hasScores && (
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent" />
                    Scores del Proyecto
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-6">
                    <ScoreGauge score={scoreNarrativo} label="Narrativo" icon={Film} />
                    <ScoreGauge score={scoreComercial} label="Comercial" icon={TrendingUp} />
                    <ScoreGauge score={scoreFestival} label="Festival" icon={Trophy} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ PRODUCIBILITY SCORE ═══ */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div>
                    <p className="text-muted-foreground">/ 100</p>
                    <Badge variant="secondary" className="mt-2"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Puntuación de Producibilidad</span>
                      <span className={getScoreColor(score)}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {score >= 70 ? 'Proyecto con alta viabilidad de producción' :
                       score >= 40 ? 'Proyecto con viabilidad media' :
                       'Proyecto con desafíos significativos'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ═══ STATS CARDS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Rango Presupuesto</p><p className="font-semibold">{budgetRange}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Personajes Principales</p><p className="font-semibold">{mainCharacters} de {characterCount}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Localizaciones</p><p className="font-semibold">{locationCount}</p></CardContent></Card>
              <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Alta Complejidad</p><p className="font-semibold">{complexLocations} loc.</p></CardContent></Card>
            </div>

            {/* ═══ DAFO ═══ */}
            {hasDAFO && (
              <>
                {dafoAnalysis.recomendacion_general && (
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium text-center italic">
                        "{dafoAnalysis.recomendacion_general}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fortalezas */}
                  {dafoAnalysis.fortalezas?.length > 0 && (
                    <Card>
                      <CardHeader className="bg-green-500/10">
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <Shield className="w-5 h-5" />
                          Fortalezas ({dafoAnalysis.fortalezas.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {dafoAnalysis.fortalezas.map((f, i) => (
                          <div key={i} className={`rounded p-3 ${impactColors[f.impacto] || ''}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{f.titulo}</p>
                              <Badge variant="outline" className={`text-xs ${categoryBadges[f.categoria] || ''}`}>{f.categoria}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{f.descripcion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Debilidades */}
                  {dafoAnalysis.debilidades?.length > 0 && (
                    <Card>
                      <CardHeader className="bg-red-500/10">
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <AlertTriangle className="w-5 h-5" />
                          Debilidades ({dafoAnalysis.debilidades.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {dafoAnalysis.debilidades.map((d, i) => (
                          <div key={i} className={`rounded p-3 ${impactColors[d.impacto] || ''}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{d.titulo}</p>
                              <Badge variant="outline" className={`text-xs ${categoryBadges[d.categoria] || ''}`}>{d.categoria}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{d.descripcion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Oportunidades */}
                  {dafoAnalysis.oportunidades?.length > 0 && (
                    <Card>
                      <CardHeader className="bg-blue-500/10">
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <Lightbulb className="w-5 h-5" />
                          Oportunidades ({dafoAnalysis.oportunidades.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {dafoAnalysis.oportunidades.map((o, i) => (
                          <div key={i} className={`rounded p-3 ${impactColors[o.impacto] || ''}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{o.titulo}</p>
                              <Badge variant="outline" className={`text-xs ${categoryBadges[o.categoria] || ''}`}>{o.categoria}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{o.descripcion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Amenazas */}
                  {dafoAnalysis.amenazas?.length > 0 && (
                    <Card>
                      <CardHeader className="bg-amber-500/10">
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <TrendingDown className="w-5 h-5" />
                          Amenazas ({dafoAnalysis.amenazas.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {dafoAnalysis.amenazas.map((a, i) => (
                          <div key={i} className={`rounded p-3 ${impactColors[a.impacto] || ''}`}>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{a.titulo}</p>
                              <Badge variant="outline" className={`text-xs ${categoryBadges[a.categoria] || ''}`}>{a.categoria}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{a.descripcion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* ═══ FACTORES POSITIVOS/NEGATIVOS (legacy) ═══ */}
            {!hasDAFO && (positiveFactors.length > 0 || negativeFactors.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="bg-green-500/10">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="w-5 h-5" />Factores Positivos ({positiveFactors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {positiveFactors.length > 0 ? (
                      <ul className="space-y-2">
                        {positiveFactors.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">+</span>
                            <span className="text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">No hay factores positivos identificados.</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="bg-red-500/10">
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <TrendingDown className="w-5 h-5" />Factores Negativos ({negativeFactors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {negativeFactors.length > 0 ? (
                      <ul className="space-y-2">
                        {negativeFactors.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">-</span>
                            <span className="text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">No hay factores negativos identificados.</p>}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ POTENCIAL DE MERCADO ═══ */}
            {marketPotential && (
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" />
                    Potencial de Mercado
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                    {marketPotential.genero_tendencia && (
                      <Badge variant="outline" className={`text-xs ${trendLabels[marketPotential.genero_tendencia]?.color || ''}`}>
                        {trendLabels[marketPotential.genero_tendencia]?.label || marketPotential.genero_tendencia}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {marketPotential.territorios_principales?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Territorios</p>
                        <div className="flex flex-wrap gap-1">
                          {marketPotential.territorios_principales.map((t, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {marketPotential.festivales_sugeridos?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                          <Trophy className="w-3 h-3 inline mr-1" />Festivales Sugeridos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {marketPotential.festivales_sugeridos.map((f, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {marketPotential.plataformas_potenciales?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">
                          <Tv className="w-3 h-3 inline mr-1" />Plataformas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {marketPotential.plataformas_potenciales.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {marketPotential.ventanas_distribucion?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-2">Ventanas de Distribución</p>
                        <div className="flex flex-wrap gap-1">
                          {marketPotential.ventanas_distribucion.map((v, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </CreativeLayout>
  );
}
