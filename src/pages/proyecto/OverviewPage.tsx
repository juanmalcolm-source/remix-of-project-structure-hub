import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Film, 
  Users, 
  MapPin, 
  Clock, 
  FileText, 
  Heart,
  Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateProject, useUpdateCreativeAnalysis } from '@/hooks/useProject';

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

  const stats = {
    personajes: project.characters?.length || 0,
    localizaciones: project.locations?.length || 0,
    secuencias: project.sequences?.length || 0,
    duracionEstimada: project.sequences?.reduce((acc, s) => acc + (s.estimated_duration_minutes || 0), 0) || 0,
  };

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><Users className="w-4 h-4" /><span className="text-sm">Personajes</span></div><p className="text-2xl font-bold">{stats.personajes}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><MapPin className="w-4 h-4" /><span className="text-sm">Localizaciones</span></div><p className="text-2xl font-bold">{stats.localizaciones}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><Film className="w-4 h-4" /><span className="text-sm">Secuencias</span></div><p className="text-2xl font-bold">{stats.secuencias}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-4 h-4" /><span className="text-sm">Duración Est.</span></div><p className="text-2xl font-bold">{stats.duracionEstimada} min</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Logline</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Textarea placeholder="Una frase que resume tu historia..." value={logline} onChange={(e) => setLogline(e.target.value)} onBlur={() => handleSave('logline')} rows={2} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Sinopsis{project.creative_analysis?.synopsis && <Badge variant="secondary" className="ml-2"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>}</CardTitle></CardHeader>
            <CardContent className="pt-4"><Textarea placeholder="Sinopsis de la historia..." value={synopsis} onChange={(e) => setSynopsis(e.target.value)} onBlur={() => handleSave('synopsis')} rows={8} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" />Core Emocional{project.creative_analysis?.core_emotional && <Badge variant="secondary" className="ml-2"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>}</CardTitle></CardHeader>
            <CardContent className="pt-4"><Textarea placeholder="El núcleo emocional de la historia..." value={coreEmocional} onChange={(e) => setCoreEmocional(e.target.value)} onBlur={() => handleSave('coreEmocional')} rows={8} /></CardContent>
          </Card>
        </div>

        {project.creative_analysis?.central_theme && (
          <Card>
            <CardHeader className="bg-primary/5"><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" />Tema Central<Badge variant="secondary" className="ml-2">IA</Badge></CardTitle></CardHeader>
            <CardContent className="pt-4"><p className="text-foreground">{project.creative_analysis.central_theme}</p></CardContent>
          </Card>
        )}
      </div>
    </CreativeLayout>
  );
}
