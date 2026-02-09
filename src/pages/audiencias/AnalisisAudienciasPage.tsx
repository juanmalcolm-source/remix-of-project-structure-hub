import { useParams } from 'react-router-dom';
import { useAudienceDesigns } from '@/hooks/useAudienceDesigns';
import { useProject } from '@/hooks/useProject';
import AudienciasLayout from '@/components/layout/AudienciasLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, AlertTriangle, Lightbulb, Target, BarChart3 } from 'lucide-react';

const formatNumber = (v: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v);

function renderJsonList(items: unknown): string[] {
  if (Array.isArray(items)) return items.map(String);
  return [];
}

export default function AnalisisAudienciasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { design, isLoading, createDesign, isCreating } = useAudienceDesigns(projectId);

  const handleGenerarMock = () => {
    createDesign({
      resumen_mercado: 'El mercado audiovisual español muestra un crecimiento sostenido en producciones independientes, con especial demanda en contenido de autor y temáticas sociales.',
      segmentos_principales: ['Cinéfilos 25-45 años', 'Público de festivales', 'Plataformas VOD', 'Distribuidoras europeas'],
      tamano_mercado_estimado: 2500000,
      tendencias: ['Auge del cine social', 'Coproducción europea', 'Contenido para plataformas', 'Diversidad en narrativas'],
      oportunidades: ['Incentivos fiscales favorables', 'Interés internacional creciente', 'Fondos europeos disponibles', 'Demanda de contenido original'],
      riesgos: ['Alta competencia en festivales', 'Ventana de estreno reducida', 'Dependencia de ayudas públicas'],
      recomendaciones: 'Priorizar circuito de festivales europeos para posicionamiento. Desarrollar estrategia de distribución híbrida (salas + plataformas). Buscar coproducción con Francia o Alemania.',
    });
  };

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Análisis de Audiencias"
          description="Estudio de mercado y segmentación del proyecto."
          actions={!design && !isLoading ? (
            <Button onClick={handleGenerarMock} disabled={isCreating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {isCreating ? 'Generando...' : 'Generar con IA'}
            </Button>
          ) : undefined}
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
            onAction={handleGenerarMock}
          />
        ) : (
          <div className="space-y-4">
            {/* KPI */}
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
              {/* Resumen */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Resumen del Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{design.resumen_mercado}</p>
                </CardContent>
              </Card>

              {/* Segmentos */}
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

              {/* Tendencias */}
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

              {/* Oportunidades */}
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

              {/* Riesgos */}
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

              {/* Recomendaciones */}
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
