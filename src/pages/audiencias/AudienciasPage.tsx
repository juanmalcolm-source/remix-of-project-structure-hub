import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAudiences } from '@/hooks/useAudiences';
import { useProject } from '@/hooks/useProject';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Users } from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = {
  alta: 'bg-red-500/10 text-red-600 border-red-500/30',
  media: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  baja: 'bg-green-500/10 text-green-600 border-green-500/30',
};

const formatNumber = (v: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(v);

interface AudienceForm {
  nombre: string;
  descripcion: string;
  rango_edad: string;
  genero: string;
  intereses: string[];
  tamano_estimado: string;
  prioridad: string;
}

const emptyForm: AudienceForm = {
  nombre: '', descripcion: '', rango_edad: '', genero: '', intereses: [], tamano_estimado: '', prioridad: 'media',
};

export default function AudienciasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { audiences, isLoading, createAudience, updateAudience, deleteAudience, isCreating, isUpdating } = useAudiences(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AudienceForm>(emptyForm);
  const [tagInput, setTagInput] = useState('');

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (a: typeof audiences[0]) => {
    setForm({
      nombre: a.nombre,
      descripcion: a.descripcion || '',
      rango_edad: a.rango_edad || '',
      genero: a.genero || '',
      intereses: a.intereses || [],
      tamano_estimado: a.tamano_estimado ? String(a.tamano_estimado) : '',
      prioridad: a.prioridad || 'media',
    });
    setEditingId(a.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      rango_edad: form.rango_edad || null,
      genero: form.genero || null,
      intereses: form.intereses,
      tamano_estimado: form.tamano_estimado ? Number(form.tamano_estimado) : null,
      prioridad: form.prioridad,
    };
    if (editingId) {
      updateAudience({ id: editingId, ...payload });
    } else {
      createAudience(payload);
    }
    setDialogOpen(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.intereses.includes(t)) {
      setForm({ ...form, intereses: [...form.intereses, t] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm({ ...form, intereses: form.intereses.filter((i) => i !== tag) });

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Segmentos de Audiencia"
          description="Define los segmentos de público objetivo del proyecto."
          actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo Segmento</Button>}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : audiences.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin segmentos"
            description="Añade segmentos de audiencia para definir a quién va dirigido tu proyecto."
            actionLabel="Nuevo Segmento"
            onAction={openNew}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((a) => (
              <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(a)}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{a.nombre}</CardTitle>
                    {a.rango_edad && <p className="text-xs text-muted-foreground mt-1">{a.rango_edad}{a.genero ? ` · ${a.genero}` : ''}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={PRIORITY_STYLES[a.prioridad || 'media']}>{a.prioridad || 'media'}</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar segmento?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará "{a.nombre}" permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAudience(a.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {a.descripcion && <p className="text-sm text-muted-foreground mb-2">{a.descripcion.length > 80 ? a.descripcion.slice(0, 80) + '…' : a.descripcion}</p>}
                  {a.tamano_estimado && <p className="text-sm font-medium mb-2"><Users className="w-3.5 h-3.5 inline mr-1" />{formatNumber(Number(a.tamano_estimado))} personas</p>}
                  {(a.intereses ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(a.intereses as string[]).slice(0, 4).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                      {(a.intereses as string[]).length > 4 && <Badge variant="outline" className="text-xs">+{(a.intereses as string[]).length - 4}</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Segmento' : 'Nuevo Segmento'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cinéfilos urbanos" /></div>
              <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Rango de edad</Label><Input value={form.rango_edad} onChange={(e) => setForm({ ...form, rango_edad: e.target.value })} placeholder="Ej: 25-45" /></div>
                <div>
                  <Label>Género</Label>
                  <Select value={form.genero} onValueChange={(v) => setForm({ ...form, genero: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mixto">Mixto</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Intereses</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Escribe y pulsa Enter" />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.intereses.map((t) => (
                    <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTag(t)}>{t} ×</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tamaño estimado</Label><Input type="number" value={form.tamano_estimado} onChange={(e) => setForm({ ...form, tamano_estimado: e.target.value })} /></div>
                <div>
                  <Label>Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
