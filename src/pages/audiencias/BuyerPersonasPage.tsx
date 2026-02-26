import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBuyerPersonas } from '@/hooks/useBuyerPersonas';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Sparkles, UserCircle, Loader2 } from 'lucide-react';

interface PersonaForm {
  nombre: string;
  edad: string;
  ocupacion: string;
  biografia: string;
  motivaciones: string[];
  frustraciones: string[];
  medios: string[];
  objetivos: string[];
}

const emptyForm: PersonaForm = {
  nombre: '', edad: '', ocupacion: '', biografia: '',
  motivaciones: [], frustraciones: [], medios: [], objetivos: [],
};

function TagField({ label, tags, onAdd, onRemove }: { label: string; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [input, setInput] = useState('');
  const add = () => { const t = input.trim(); if (t && !tags.includes(t)) onAdd(t); setInput(''); };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} placeholder="Escribe y pulsa Enter" />
        <Button type="button" variant="outline" size="sm" onClick={add}>+</Button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {tags.map((t) => <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => onRemove(t)}>{t} ×</Badge>)}
      </div>
    </div>
  );
}

export default function BuyerPersonasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { toast } = useToast();
  const { personas, isLoading, createPersona, updatePersona, deletePersona, isCreating, isUpdating } = useBuyerPersonas(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaForm>(emptyForm);

  // AI generation state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: typeof personas[0]) => {
    setForm({
      nombre: p.nombre,
      edad: p.edad ? String(p.edad) : '',
      ocupacion: p.ocupacion || '',
      biografia: p.biografia || '',
      motivaciones: p.motivaciones || [],
      frustraciones: p.frustraciones || [],
      medios: p.medios || [],
      objetivos: p.objetivos || [],
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    const payload = {
      nombre: form.nombre,
      edad: form.edad ? Number(form.edad) : null,
      ocupacion: form.ocupacion || null,
      biografia: form.biografia || null,
      motivaciones: form.motivaciones,
      frustraciones: form.frustraciones,
      medios: form.medios,
      objetivos: form.objetivos,
    };
    if (editingId) updatePersona({ id: editingId, ...payload });
    else createPersona(payload);
    setDialogOpen(false);
  };

  // Build rich context from project analysis
  const buildProjectContext = () => {
    if (!project) return '';
    const parts: string[] = [];
    parts.push(`Película: "${project.title}"`);
    if (project.logline) parts.push(`Logline: ${project.logline}`);
    if (project.genero) parts.push(`Género: ${project.genero}`);
    if (project.tono) parts.push(`Tono: ${project.tono}`);

    const analysis = project.creative_analysis;
    if (analysis) {
      if (analysis.central_theme) parts.push(`Tema central: ${analysis.central_theme}`);
      if (analysis.score_comercial) parts.push(`Potencial comercial: ${analysis.score_comercial}/100`);
      if (analysis.score_festival) parts.push(`Potencial festival: ${analysis.score_festival}/100`);
      const mp = analysis.market_potential as Record<string, unknown> | null;
      if (mp && typeof mp === 'object' && !Array.isArray(mp)) {
        if (Array.isArray(mp.territorios_principales)) parts.push(`Territorios objetivo: ${(mp.territorios_principales as string[]).join(', ')}`);
        if (Array.isArray(mp.plataformas_potenciales)) parts.push(`Plataformas: ${(mp.plataformas_potenciales as string[]).join(', ')}`);
      }
    }

    return parts.join('\n');
  };

  const handleOpenAiDialog = () => {
    setAiPrompt(buildProjectContext());
    setAiDialogOpen(true);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    if (!project?.creative_analysis) {
      toast({ title: 'Sin análisis de guión', description: 'Para mejores resultados, analiza el guión primero desde la Parte Creativa.' });
    }
    setAiLoading(true);
    try {
      const text = await generateWithAI({
        prompt: `Genera 3 buyer personas para este proyecto cinematográfico. UNO debe ser el perfil PRIMARIO (mayor afinidad), y DOS perfiles SECUNDARIOS (audiencia complementaria).\n\nDATOS DEL PROYECTO:\n${aiPrompt}`,
        systemPrompt: `Eres un experto en marketing cinematográfico y análisis de audiencias del mercado español y europeo. Genera 3 buyer personas segmentados: 1 PRIMARIO (máxima afinidad con el proyecto) y 2 SECUNDARIOS (audiencias complementarias).

Para cada persona, basa tus decisiones en el género, tono, tema central y territorios del proyecto. Si se mencionan plataformas (Netflix, MUBI, etc.), usa eso para informar los medios de consumo.

Devuelve SOLO un JSON array (sin texto adicional) con objetos que tengan: nombre (string, nombre ficticio español), edad (number), ocupacion (string), biografia (string, 3-4 frases que expliquen su relación con el cine y este tipo de contenido), motivaciones (string[], por qué verían esta película), frustraciones (string[], qué les falta en la oferta actual), medios (string[], dónde consumen contenido audiovisual), objetivos (string[], qué buscan al ver una película como esta).`,
        maxTokens: 3000,
      });

      const generated = extractJson<Array<{
        nombre: string;
        edad?: number;
        ocupacion?: string;
        biografia?: string;
        motivaciones?: string[];
        frustraciones?: string[];
        medios?: string[];
        objetivos?: string[];
      }>>(text);

      for (const p of generated) {
        createPersona({
          nombre: p.nombre,
          edad: p.edad ?? null,
          ocupacion: p.ocupacion ?? null,
          biografia: p.biografia ?? null,
          motivaciones: p.motivaciones ?? [],
          frustraciones: p.frustraciones ?? [],
          medios: p.medios ?? [],
          objetivos: p.objetivos ?? [],
        });
      }

      toast({ title: 'IA completada', description: `${generated.length} buyer personas generadas con IA` });
      setAiDialogOpen(false);
    } catch (err: unknown) {
      toast({ title: 'Error de IA', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const updateTags = (field: keyof PersonaForm, tags: string[]) => setForm({ ...form, [field]: tags });

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Buyer Personas"
          description="Perfiles detallados de tu público objetivo."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenAiDialog}>
                <Sparkles className="w-4 h-4 mr-2" />Generar con IA
              </Button>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nueva Persona</Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : personas.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="Sin buyer personas"
            description="Crea perfiles de buyer persona para entender mejor a tu audiencia."
            actionLabel="Generar con IA"
            onAction={handleOpenAiDialog}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((p) => (
              <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(p)}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.nombre}</CardTitle>
                      <p className="text-xs text-muted-foreground">{p.edad ? `${p.edad} años` : ''}{p.ocupacion ? ` · ${p.ocupacion}` : ''}</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar persona?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará "{p.nombre}" permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePersona(p.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.biografia && <p className="text-sm text-muted-foreground">{p.biografia.length > 100 ? p.biografia.slice(0, 100) + '…' : p.biografia}</p>}
                  {(p.motivaciones ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Motivaciones</p>
                      <div className="flex flex-wrap gap-1">{(p.motivaciones as string[]).map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}</div>
                    </div>
                  )}
                  {(p.medios ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Medios</p>
                      <div className="flex flex-wrap gap-1">{(p.medios as string[]).map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Manual create/edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Persona' : 'Nueva Persona'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Edad</Label><Input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} /></div>
                <div><Label>Ocupación</Label><Input value={form.ocupacion} onChange={(e) => setForm({ ...form, ocupacion: e.target.value })} /></div>
              </div>
              <div><Label>Biografía</Label><Textarea value={form.biografia} onChange={(e) => setForm({ ...form, biografia: e.target.value })} rows={3} /></div>
              <TagField label="Motivaciones" tags={form.motivaciones} onAdd={(t) => updateTags('motivaciones', [...form.motivaciones, t])} onRemove={(t) => updateTags('motivaciones', form.motivaciones.filter((x) => x !== t))} />
              <TagField label="Frustraciones" tags={form.frustraciones} onAdd={(t) => updateTags('frustraciones', [...form.frustraciones, t])} onRemove={(t) => updateTags('frustraciones', form.frustraciones.filter((x) => x !== t))} />
              <TagField label="Medios" tags={form.medios} onAdd={(t) => updateTags('medios', [...form.medios, t])} onRemove={(t) => updateTags('medios', form.medios.filter((x) => x !== t))} />
              <TagField label="Objetivos" tags={form.objetivos} onAdd={(t) => updateTags('objetivos', [...form.objetivos, t])} onRemove={(t) => updateTags('objetivos', form.objetivos.filter((x) => x !== t))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.nombre.trim() || isCreating || isUpdating}>
                {editingId ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI generation dialog */}
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generar Buyer Personas con IA
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Describe brevemente tu proyecto/película</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ej: Drama social sobre inmigración en el sur de España, dirigido a público adulto cinéfilo..."
                />
              </div>
              <p className="text-xs text-muted-foreground">Se generarán 3 buyer personas basados en la descripción del proyecto.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiDialogOpen(false)} disabled={aiLoading}>Cancelar</Button>
              <Button onClick={handleGenerateAI} disabled={!aiPrompt.trim() || aiLoading}>
                {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando...</> : 'Generar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AudienciasLayout>
  );
}
