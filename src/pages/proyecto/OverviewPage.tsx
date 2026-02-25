import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Film,
  Users,
  MapPin,
  Clock,
  FileText,
  Heart,
  Sparkles,
  Target,
  TrendingUp,
  Palette,
  Tag,
  Eye,
  Trophy,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateProject, useUpdateCreativeAnalysis } from '@/hooks/useProject';
import { Json } from '@/integrations/supabase/types';

function parseStringArray(data: Json | null | undefined): string[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter((item): item is string => typeof item === 'string');
}

export default function OverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error } = useProject(projectId);
  const updateProject = useUpdateProject();
  const updateAnalysis = useUpdateCreativeAnalysis();

  const [logline, setLogline] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [coreEmocional, setCoreEmocional] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setLogline(project.logline || '');
      setSynopsis(project.creative_analysis?.synopsis || '');
      setCoreEmocional(project.creative_analysis?.core_emotional || '');
    }
  }, [project]);

  const handleSave = async (field: 'logline' | 'synopsis' | 'coreEmocional') => {
    if (!project) return;

    setIsSaving(true);
    try {
      if (field === 'logline') {
        await updateProject.mutateAsync({ id: project.id, data: { logline } });
      } else {
        await updateAnalysis.mutateAsync({
          projectId: project.id,
          data: field === 'synopsis' ? { synopsis } : { core_emotional: coreEmocional }
        });
      }
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CreativeLayout projectTitle="Cargando...">
        <PageSkeleton variant="overview" />
      </CreativeLayout>
    );
  }

  if (error || !project) {
    return (
      <CreativeLayout projectTitle="Error">
        <ErrorState message="No se pudo cargar el proyecto" />
      </CreativeLayout>
    );
  }

  const duracionFromSequences = project.sequences?.reduce((acc, s) => acc + (s.estimated_duration_minutes || 0), 0) || 0;
  const duracionFromScript = project.script_text ? Math.ceil(project.script_text.length / 600) : 0;
  const duracionEstimada = duracionFromSequences > 0 ? duracionFromSequences : duracionFromScript;

  const stats = {
    personajes: project.characters?.length || 0,
    localizaciones: project.locations?.length || 0,
    secuencias: project.sequences?.length || 0,
    duracionEstimada,
  };

  const analysis = project.creative_analysis;

  const projectType = project.project_type || 'largometraje';
  const isTypeInconsistent = duracionFromScript > 0 && (
    (duracionFromScript < 60 && projectType === 'largometraje') ||
    (duracionFromScript >= 60 && projectType === 'cortometraje')
  );

  const projectTypeLabel = {
    cortometraje: 'Cortometraje',
    largometraje: 'Largometraje',
    documental: 'Documental',
    serie: 'Serie',
  }[projectType] || 'Largometraje';

  // New enriched data
  const genero = project.genero as string | null;
  const tono = project.tono as string | null;
  const estiloVisual = project.estilo_visual_sugerido as string | null;
  const publicoObjetivo = project.publico_objetivo_sugerido as string | null;
  const subgeneros = parseStringArray(project.subgeneros);
  const referentes = parseStringArray(project.referentes_cinematograficos);

  // Scores
  const scoreNarrativo = (analysis?.score_narrativo as number) || 0;
  const scoreComercial = (analysis?.score_comercial as number) || 0;
  const scoreFestival = (analysis?.score_festival as number) || 0;
  const hasScores = scoreNarrativo > 0 || scoreComercial > 0 || scoreFestival > 0;

  const potencialFestival = analysis?.potencial_festival as string | null;
  const potencialComercial = analysis?.potencial_comercial as string | null;

  const potencialColor = (val: string | null) => {
    switch (val) {
      case 'Alto': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
      case 'Medio': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'Bajo': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const hasEnrichedData = genero || tono || estiloVisual || subgeneros.length > 0 || referentes.length > 0;

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        {/* Project Type & Genre Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {projectTypeLabel}
          </Badge>
          {genero && (
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {genero}
            </Badge>
          )}
          {subgeneros.map((sg, i) => (
            <Badge key={i} variant="outline" className="text-xs">{sg}</Badge>
          ))}
          {duracionFromScript > 0 && (
            <Badge variant="secondary" className="text-xs py-1 px-2">
              ~{duracionFromScript} págs
            </Badge>
          )}
          {tono && (
            <Badge variant="outline" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />{tono}
            </Badge>
          )}
          {potencialFestival && (
            <Badge variant="outline" className={`text-xs ${potencialColor(potencialFestival)}`}>
              <Trophy className="w-3 h-3 mr-1" />Festival: {potencialFestival}
            </Badge>
          )}
          {potencialComercial && (
            <Badge variant="outline" className={`text-xs ${potencialColor(potencialComercial)}`}>
              <TrendingUp className="w-3 h-3 mr-1" />Comercial: {potencialComercial}
            </Badge>
          )}
        </div>

        {isTypeInconsistent && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Este proyecto tiene ~{duracionFromScript} páginas, lo que sugiere
              {duracionFromScript < 60 ? ' un cortometraje' : ' un largometraje'}.
              Puedes cambiar el tipo en <strong>Financiación - Configuración</strong>.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-cinematic">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Personajes</span>
              </div>
              <p className="text-2xl font-bold font-display">{stats.personajes}</p>
            </CardContent>
          </Card>
          <Card className="card-cinematic">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Localizaciones</span>
              </div>
              <p className="text-2xl font-bold font-display">{stats.localizaciones}</p>
            </CardContent>
          </Card>
          <Card className="card-cinematic">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Film className="w-4 h-4" />
                <span className="text-sm">Secuencias</span>
              </div>
              <p className="text-2xl font-bold font-display">{stats.secuencias}</p>
            </CardContent>
          </Card>
          <Card className="card-cinematic">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Duración Est.</span>
              </div>
              <p className="text-2xl font-bold font-display">{stats.duracionEstimada} min</p>
            </CardContent>
          </Card>
        </div>

        {/* 3 Scores Row (compact) */}
        {hasScores && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="card-cinematic">
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Film className="w-3 h-3" />
                  <span className="text-xs">Narrativo</span>
                </div>
                <p className={`text-2xl font-bold font-display ${scoreNarrativo >= 70 ? 'text-green-600' : scoreNarrativo >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {scoreNarrativo}
                </p>
              </CardContent>
            </Card>
            <Card className="card-cinematic">
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">Comercial</span>
                </div>
                <p className={`text-2xl font-bold font-display ${scoreComercial >= 70 ? 'text-green-600' : scoreComercial >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {scoreComercial}
                </p>
              </CardContent>
            </Card>
            <Card className="card-cinematic">
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs">Festival</span>
                </div>
                <p className={`text-2xl font-bold font-display ${scoreFestival >= 70 ? 'text-green-600' : scoreFestival >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {scoreFestival}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logline */}
        <Card className="card-cinematic">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 font-display">
              <FileText className="w-5 h-5 text-accent" />
              Logline
              {project.logline && (
                <Badge variant="secondary" className="ml-2 badge-gold">
                  <Sparkles className="w-3 h-3 mr-1" />IA
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Textarea
              placeholder="Una frase que resume tu historia (generada automáticamente por IA)..."
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              onBlur={() => handleSave('logline')}
              rows={2}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Synopsis & Core Emocional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-cinematic">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 font-display">
                <FileText className="w-5 h-5 text-accent" />
                Sinopsis
                {analysis?.synopsis && (
                  <Badge variant="secondary" className="ml-2 badge-gold">
                    <Sparkles className="w-3 h-3 mr-1" />IA
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                placeholder="Sinopsis de la historia (generada automáticamente por IA)..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                onBlur={() => handleSave('synopsis')}
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>

          <Card className="card-cinematic">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 font-display">
                <Heart className="w-5 h-5 text-accent" />
                Core Emocional
                {analysis?.core_emotional && (
                  <Badge variant="secondary" className="ml-2 badge-gold">
                    <Sparkles className="w-3 h-3 mr-1" />IA
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                placeholder="El núcleo emocional de la historia (generado automáticamente por IA)..."
                value={coreEmocional}
                onChange={(e) => setCoreEmocional(e.target.value)}
                onBlur={() => handleSave('coreEmocional')}
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Tema Central */}
        {analysis?.central_theme && (
          <Card className="card-cinematic">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 font-display">
                <Target className="w-5 h-5 text-accent" />
                Tema Central
                <Badge variant="secondary" className="ml-2 badge-gold">
                  <Sparkles className="w-3 h-3 mr-1" />IA
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-foreground leading-relaxed">{analysis.central_theme}</p>
            </CardContent>
          </Card>
        )}

        {/* Enriched Data: Visual Style, Audience, Referentes */}
        {hasEnrichedData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(estiloVisual || publicoObjetivo) && (
              <Card className="card-cinematic">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Eye className="w-5 h-5 text-accent" />
                    Perfil Creativo
                    <Badge variant="secondary" className="ml-2 badge-gold">
                      <Sparkles className="w-3 h-3 mr-1" />IA
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {estiloVisual && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Estilo Visual Sugerido</p>
                      <p className="text-sm">{estiloVisual}</p>
                    </div>
                  )}
                  {publicoObjetivo && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Público Objetivo</p>
                      <p className="text-sm">{publicoObjetivo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {referentes.length > 0 && (
              <Card className="card-cinematic">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Star className="w-5 h-5 text-accent" />
                    Referentes Cinematográficos
                    <Badge variant="secondary" className="ml-2 badge-gold">
                      <Sparkles className="w-3 h-3 mr-1" />IA
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {referentes.map((ref, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                        <Film className="w-3 h-3 mr-1" />{ref}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Producibility Score & Budget */}
        {(analysis?.producibility_score || analysis?.estimated_budget_range) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.producibility_score !== null && (
              <Card className="card-cinematic">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Índice de Producibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold font-display text-accent">
                      {analysis.producibility_score}%
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-gold transition-all duration-500"
                          style={{ width: `${analysis.producibility_score}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {analysis.producibility_score >= 80 ? 'Alta producibilidad' :
                         analysis.producibility_score >= 60 ? 'Producibilidad media' :
                         analysis.producibility_score >= 40 ? 'Complejidad moderada' :
                         'Alta complejidad'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.estimated_budget_range && (
              <Card className="card-cinematic">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Film className="w-5 h-5 text-accent" />
                    Presupuesto Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold font-display text-accent">
                    {analysis.estimated_budget_range}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimación basada en análisis de complejidad
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </CreativeLayout>
  );
}
