import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProject, useUpdateProductionNotes } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Save,
  FileText,
  Target,
  Palette,
  Heart,
  Users,
  Clapperboard,
  CheckCircle2,
  Loader2,
  MapPin,
  Eye
} from 'lucide-react';

interface MemoriaSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
  isGenerating: boolean;
}

const SECTION_DEFS = [
  { id: 'director_intentions', title: 'Intenciones del Director', description: 'Visión artística, motivación y objetivos narrativos', icon: <Clapperboard className="h-5 w-5" /> },
  { id: 'artistic_vision', title: 'Visión Artística', description: 'Estética visual, tono y atmósfera del proyecto', icon: <Palette className="h-5 w-5" /> },
  { id: 'personal_connection', title: 'Conexión Personal', description: 'Por qué esta historia importa al equipo', icon: <Heart className="h-5 w-5" /> },
  { id: 'target_audience', title: 'Público Objetivo', description: 'A quién va dirigido y por qué conectará', icon: <Target className="h-5 w-5" /> },
  { id: 'aesthetic_proposal', title: 'Propuesta Estética', description: 'Fotografía, arte, vestuario y localizaciones', icon: <Palette className="h-5 w-5" /> },
  { id: 'production_viability', title: 'Viabilidad de Producción', description: 'Plan de producción y recursos disponibles', icon: <FileText className="h-5 w-5" /> },
  { id: 'team_strengths', title: 'Fortalezas del Equipo', description: 'Experiencia y trayectoria del equipo', icon: <Users className="h-5 w-5" /> },
  { id: 'confirmed_locations', title: 'Localizaciones Confirmadas', description: 'Detalles de las localizaciones aseguradas para el rodaje', icon: <MapPin className="h-5 w-5" /> },
  { id: 'visual_references', title: 'Referencias Visuales', description: 'Películas, fotógrafos o artistas que inspiran el look del proyecto', icon: <Eye className="h-5 w-5" /> },
] as const;

export default function MemoriaProduccionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading } = useProject(projectId);
  const updateNotes = useUpdateProductionNotes();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sections, setSections] = useState<MemoriaSection[]>(
    SECTION_DEFS.map(def => ({ ...def, content: '', isGenerating: false }))
  );
  const [initializedFromDb, setInitializedFromDb] = useState(false);

  // Load existing production notes from DB
  useEffect(() => {
    if (project?.production_notes && !initializedFromDb) {
      const notes = project.production_notes;
      setSections(prev => prev.map(s => ({
        ...s,
        content: (notes as Record<string, unknown>)[s.id] as string || '',
      })));
      setInitializedFromDb(true);
    }
  }, [project, initializedFromDb]);

  // Build project data for AI generation from real project data + analysis
  const analysis = project?.creative_analysis;
  const marketPotential = (() => {
    const mp = analysis?.market_potential;
    if (!mp || typeof mp !== 'object' || Array.isArray(mp)) return null;
    return mp as Record<string, unknown>;
  })();

  const projectData = project ? {
    titulo: project.title || '',
    logline: project.logline || '',
    genero: project.genero || '',
    tono: project.tono || '',
    estilo_visual: project.estilo_visual_sugerido || '',
    personajes: (project.characters || []).map(c => ({ nombre: c.name, categoria: c.category, descripcion: c.description })),
    localizaciones: (project.locations || []).map(l => ({ nombre: l.name, tipo: l.type, descripcion: l.description })),
    // Analysis context
    sinopsis: analysis?.synopsis || '',
    tema_central: analysis?.central_theme || '',
    nucleo_emocional: analysis?.core_emotional || '',
    score_narrativo: analysis?.score_narrativo ?? null,
    score_comercial: analysis?.score_comercial ?? null,
    score_festival: analysis?.score_festival ?? null,
    potencial_comercial: analysis?.potencial_comercial || '',
    potencial_festival: analysis?.potencial_festival || '',
    estimated_budget_range: analysis?.estimated_budget_range || '',
    festivales_sugeridos: Array.isArray(marketPotential?.festivales_sugeridos) ? marketPotential.festivales_sugeridos : [],
    territorios_principales: Array.isArray(marketPotential?.territorios_principales) ? marketPotential.territorios_principales : [],
    plataformas_potenciales: Array.isArray(marketPotential?.plataformas_potenciales) ? marketPotential.plataformas_potenciales : [],
  } : null;

  const handleContentChange = (sectionId: string, content: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, content } : s
    ));
  };

  const generateWithAI = async (sectionId: string) => {
    if (!projectData) return;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, isGenerating: true } : s
    ));

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-memoria`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          section: sectionId,
          projectData,
          currentContent: section.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar contenido');
      }

      if (!response.body) {
        throw new Error('No se recibió respuesta del servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let generatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              generatedContent += content;
              setSections(prev => prev.map(s => 
                s.id === sectionId ? { ...s, content: generatedContent } : s
              ));
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }

      toast({
        title: "Contenido generado",
        description: "Revisa y ajusta el texto según tus necesidades.",
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el contenido",
        variant: "destructive",
      });
    } finally {
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, isGenerating: false } : s
      ));
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const data: Record<string, string> = {};
      for (const s of sections) {
        data[s.id] = s.content;
      }
      await updateNotes.mutateAsync({ projectId, data });
      setLastSaved(new Date());
      toast({
        title: "Memoria guardada",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error saving production notes:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const completedSections = sections.filter(s => s.content.length > 50).length;
  const progress = Math.round((completedSections / sections.length) * 100);

  if (isLoading) {
    return (
      <ProductionLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ProductionLayout>
    );
  }

  return (
    <ProductionLayout projectTitle={project?.title || 'Mi Proyecto'} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Memoria de Producción</h1>
            <p className="text-muted-foreground">
              Redacta la memoria para presentar a convocatorias de ayudas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Progreso</div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* Sections Grid */}
        <Tabs defaultValue={sections[0].id} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
                {section.content.length > 50 && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.content.length > 50 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateWithAI(section.id)}
                        disabled={section.isGenerating}
                      >
                        {section.isGenerating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {section.content ? 'Mejorar con IA' : 'Generar con IA'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={section.content}
                    onChange={(e) => handleContentChange(section.id, e.target.value)}
                    placeholder={`Escribe aquí ${section.title.toLowerCase()} o usa el botón de IA para generar un borrador...`}
                    className="min-h-[300px] resize-y"
                    disabled={section.isGenerating}
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>{section.content.length} caracteres</span>
                    <span>Mínimo recomendado: 500 caracteres</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Tips Card */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Consejos para una memoria efectiva</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sé específico y concreto, evita generalidades</li>
                  <li>• Conecta tu visión artística con la viabilidad comercial</li>
                  <li>• Menciona referencias cinematográficas relevantes</li>
                  <li>• Destaca la experiencia del equipo en proyectos similares</li>
                  <li>• Adapta el tono según la convocatoria (ICAA, Europa Creativa, etc.)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}
