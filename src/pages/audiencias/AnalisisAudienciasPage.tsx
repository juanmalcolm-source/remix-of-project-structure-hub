import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAudienceDesigns } from '@/hooks/useAudienceDesigns';
import { useProject } from '@/hooks/useProject';
import { generateWithAI, extractJson } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import AudienciasLayout from '@/components/layout/AudienciasLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, AlertTriangle, Lightbulb, Target, BarChart3, Loader2, RefreshCw } from 'lucide-react';

const formatNumber = (v: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v);

function renderJsonList(items: unknown): string[] {
  if (Array.isArray(items)) return items.map(String);
  return [];
}

export default function AnalisisAudienciasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { toast } = useToast();
  const { design, isLoading, createDesign, updateDesign, isCreating, isUpdating } = useAudienceDesigns(projectId);

  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const projectDesc = project?.title
        ? `Proyecto: "${project.title}"${project.logline ? `. Logline: ${project.logline}` : ''}`
        : 'Un proyecto cinematográfico español';

      const text = await generateWithAI({
        prompt: `Analiza el potencial de mercado para este proyecto:\n\n${projectDesc}`,
        systemPrompt: 'Eres un experto en análisis de mercado cinematográfico español y europeo. Analiza el potencial de mercado para una película. Devuelve SOLO un JSON (sin texto adicional) con: tamano_mercado_estimado (number, estimación de espectadores potenciales), resumen_mercado (string, 2-3 frases), segmentos_principales (string[], 4-5 segmentos), tendencias (string[], 4 tendencias del sector), oportunidades (string[], 4 oportunidades), riesgos (string[], 4 riesgos), recomendaciones (string, 2-3 frases de recomendación).',
        maxTokens: 2048,
      });

      const result = extractJson<{
        tamano_mercado_estimado?: number;
        resumen_mercado?: string;
        segmentos_principales?: string[];
        tendencias?: string[];
        oportunidades?: string[];
        riesgos?: string[];
        recomendaciones?: string;
      }>(text);

      const payload = {
        resumen_mercado: result.resumen_mercado || null,
        segmentos_principales: result.segmentos_principales || null,
        tamano_mercado_estimado: result.tamano_mercado_estimado || null,
        tendencias: result.tendencias || null,
        oportunidades: result.oportunidades || null,
        riesgos: result.riesgos || null,
        recomendaciones: result.recomendaciones || null,
      };

      if (design) {
        updateDesign({ id: design.id, ...payload });
      } else {
        createDesign(payload);
      }

      toast({ title: 'IA completada', description: 'Análisis de mercado generado con IA' });
    } catch (err: any) {
      toast({ title: 'Error de IA', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const generating = aiLoading || isCreating || isUpdating;

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Análisis de Audiencias"
          description="Estudio de mercado y segmentación del proyecto."
          actions={
            <Button onClick={handleGenerateAI} disabled={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</>
              ) : design ? (
                <><RefreshCw className="w-4 h-4 mr-2" />Regenerar con IA</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generar con IA</>
              )}
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : !design ? (
          <EmptyState
            icon={BarChart3}
            title="Sin análisis de mercado"
            description="Genera un análisis de audiencias con IA para obtener insights sobre el mercado de tu proyecto."
            actionLabel="Generar con IA"
            onAction={handleGenerateAI}
          />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Tamaño Estimado del Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatNumber(Number(design.tamano_mercado_estimado) || 0)} <span className="text-lg font-normal text-muted-foreground">personas</span></p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Resumen del Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{design.resumen_mercado}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Segmentos Principales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {renderJsonList(design.segmentos_principales).map((s, i) => (
                      <Badge key={i} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Tendencias</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {renderJsonList(design.tendencias).map((t, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>{t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Lightbulb className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Oportunidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {renderJsonList(design.oportunidades).map((o, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>{o}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">Riesgos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {renderJsonList(design.riesgos).map((r, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{design.recomendaciones}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AudienciasLayout>
  );
}
