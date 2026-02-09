import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBuyerPersonas } from '@/hooks/useBuyerPersonas';
import { useProject } from '@/hooks/useProject';
import AudienciasLayout from '@/components/layout/AudienciasLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Info, Plus, Trash2, Sparkles, UserCircle } from 'lucide-react';

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
  const { personas, isLoading, createPersona, updatePersona, deletePersona, isCreating, isUpdating } = useBuyerPersonas(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaForm>(emptyForm);

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

  const handleGenerarMock = () => {
    createPersona({
      nombre: 'María García',
      edad: 34,
      ocupacion: 'Profesora universitaria',
      biografia: 'Cinéfila empedernida que busca películas con mensaje social. Asiste a festivales y sigue blogs de cine independiente.',
      motivaciones: ['Historias auténticas', 'Cine comprometido', 'Descubrir nuevos directores'],
      frustraciones: ['Falta de oferta en salas', 'Marketing engañoso', 'Subtítulos de mala calidad'],
      medios: ['Instagram', 'Letterboxd', 'Podcasts de cine', 'Festivales'],
      objetivos: ['Encontrar películas que inspiren', 'Apoyar cine independiente'],
    });
  };

  const updateTags = (field: keyof PersonaForm, tags: string[]) => setForm({ ...form, [field]: tags });

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-display font-bold">Buyer Personas</h1>
            <p className="text-muted-foreground mt-1">Perfiles detallados de tu público objetivo.</p>
          </div>
          <div className="flex gap-2">
            {personas.length === 0 && !isLoading && (
              <Button variant="outline" onClick={handleGenerarMock} disabled={isCreating}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </Button>
            )}
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Persona
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : personas.length === 0 ? (
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Sin buyer personas</AlertTitle>
            <AlertDescription className="text-blue-600">Crea perfiles de buyer persona para entender mejor a tu audiencia.</AlertDescription>
          </Alert>
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
      </div>
    </AudienciasLayout>
  );
}
