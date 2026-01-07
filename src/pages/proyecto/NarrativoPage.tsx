import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateCreativeAnalysis } from '@/hooks/useProject';
import { Json } from '@/integrations/supabase/types';

interface ActStructure { acto: number; nombre: string; descripcion: string; }
interface TurningPoint { nombre: string; descripcion: string; momento?: string; }

function parseJsonArray<T>(data: Json | null | undefined): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data as T[];
}

export default function NarrativoPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error } = useProject(projectId);
  const updateAnalysis = useUpdateCreativeAnalysis();

  const [actStructure, setActStructure] = useState<ActStructure[]>([]);
  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project?.creative_analysis) {
      setActStructure(parseJsonArray<ActStructure>(project.creative_analysis.act_structure));
      setTurningPoints(parseJsonArray<TurningPoint>(project.creative_analysis.turning_points));
    }
  }, [project]);

  const handleSaveAct = async (index: number, descripcion: string) => {
    if (!projectId) return;
    const updated = [...actStructure];
    updated[index] = { ...updated[index], descripcion };
    setActStructure(updated);
    setIsSaving(true);
    try {
      await updateAnalysis.mutateAsync({ projectId, data: { act_structure: updated as unknown as Json } });
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch { toast({ title: 'Error al guardar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <CreativeLayout projectTitle="Cargando..."><PageSkeleton variant="cards" /></CreativeLayout>;
  if (error || !project) return <CreativeLayout projectTitle="Error"><ErrorState message="No se pudo cargar el proyecto" /></CreativeLayout>;

  const hasAnalysis = project.creative_analysis && (actStructure.length > 0 || turningPoints.length > 0);

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        <div className="flex items-center gap-3"><BookOpen className="w-6 h-6" /><div><h2 className="text-2xl font-bold">Análisis Narrativo</h2><p className="text-muted-foreground">Estructura dramática del guión</p></div></div>

        {!hasAnalysis ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center"><Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">Sin análisis narrativo</h3><p className="text-muted-foreground">Analiza un guión para generar automáticamente la estructura de 3 actos y puntos de giro.</p></CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2">Estructura de 3 Actos<Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge></CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {actStructure.map((acto, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{acto.acto || index + 1}</div><span className="font-medium">{acto.nombre || `Acto ${index + 1}`}</span></div>
                      <Textarea value={acto.descripcion || ''} onChange={(e) => { const u = [...actStructure]; u[index] = { ...u[index], descripcion: e.target.value }; setActStructure(u); }} onBlur={(e) => handleSaveAct(index, e.target.value)} placeholder="Descripción del acto..." rows={4} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {turningPoints.length > 0 && (
              <Card>
                <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2">Puntos de Giro<Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge></CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {turningPoints.map((point, index) => (
                      <div key={index} className="flex gap-4 items-start border-l-4 border-primary pl-4">
                        <div><h4 className="font-medium">{point.nombre}</h4>{point.momento && <span className="text-xs text-muted-foreground">{point.momento}</span>}<p className="text-sm text-muted-foreground mt-1">{point.descripcion}</p></div>
                      </div>
                    ))}
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
