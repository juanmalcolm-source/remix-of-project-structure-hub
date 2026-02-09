import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFestivals } from '@/hooks/useFestivals';
import { useProject } from '@/hooks/useProject';
import AudienciasLayout from '@/components/layout/AudienciasLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Film } from 'lucide-react';

const PRIORITY_STYLES: Record<string, string> = { alta: 'bg-red-500/10 text-red-600 border-red-500/30', media: 'bg-amber-500/10 text-amber-600 border-amber-500/30', baja: 'bg-green-500/10 text-green-600 border-green-500/30' };
const ESTADO_STYLES: Record<string, string> = { pendiente: 'bg-muted text-muted-foreground', enviado: 'bg-blue-500/10 text-blue-600 border-blue-500/30', aceptado: 'bg-green-500/10 text-green-600 border-green-500/30', rechazado: 'bg-red-500/10 text-red-600 border-red-500/30' };

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

interface FestivalForm { nombre: string; pais: string; fecha_limite: string; categoria: string; estrategia: string; prioridad: string; estado: string; notas: string; }
const emptyForm: FestivalForm = { nombre: '', pais: '', fecha_limite: '', categoria: '', estrategia: '', prioridad: 'media', estado: 'pendiente', notas: '' };

export default function FestivalesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { festivals, isLoading, createFestival, updateFestival, deleteFestival, isCreating, isUpdating } = useFestivals(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FestivalForm>(emptyForm);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (f: typeof festivals[0]) => {
    setForm({ nombre: f.nombre, pais: f.pais || '', fecha_limite: f.fecha_limite || '', categoria: f.categoria || '', estrategia: f.estrategia || '', prioridad: f.prioridad || 'media', estado: f.estado || 'pendiente', notas: f.notas || '' });
    setEditingId(f.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    const payload = { nombre: form.nombre, pais: form.pais || null, fecha_limite: form.fecha_limite || null, categoria: form.categoria || null, estrategia: form.estrategia || null, prioridad: form.prioridad, estado: form.estado, notas: form.notas || null };
    if (editingId) updateFestival({ id: editingId, ...payload });
    else createFestival(payload);
    setDialogOpen(false);
  };

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Festivales"
          description="Estrategia de festivales y mercados."
          actions={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo Festival</Button>}
        />

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        ) : festivals.length === 0 ? (
          <EmptyState
            icon={Film}
            title="Sin festivales"
            description="Añade festivales para planificar tu estrategia de lanzamiento."
            actionLabel="Nuevo Festival"
            onAction={openNew}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Fecha límite</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {festivals.map(f => (
                    <TableRow key={f.id} className="cursor-pointer" onClick={() => openEdit(f)}>
                      <TableCell className="font-medium">{f.nombre}</TableCell>
                      <TableCell>{f.pais || '—'}</TableCell>
                      <TableCell>{formatDate(f.fecha_limite)}</TableCell>
                      <TableCell>{f.categoria || '—'}</TableCell>
                      <TableCell><Badge className={PRIORITY_STYLES[f.prioridad || 'media']}>{f.prioridad}</Badge></TableCell>
                      <TableCell><Badge className={ESTADO_STYLES[f.estado || 'pendiente']}>{f.estado}</Badge></TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={e => e.stopPropagation()}>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar festival?</AlertDialogTitle><AlertDialogDescription>Se eliminará "{f.nombre}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteFestival(f.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? 'Editar Festival' : 'Nuevo Festival'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>País</Label><Input value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} /></div>
                <div><Label>Fecha límite</Label><Input type="date" value={form.fecha_limite} onChange={e => setForm({ ...form, fecha_limite: e.target.value })} /></div>
              </div>
              <div><Label>Categoría</Label><Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Competición oficial" /></div>
              <div><Label>Estrategia</Label><Textarea value={form.estrategia} onChange={e => setForm({ ...form, estrategia: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prioridad</Label>
                  <Select value={form.prioridad} onValueChange={v => setForm({ ...form, prioridad: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="baja">Baja</SelectItem></SelectContent></Select>
                </div>
                <div><Label>Estado</Label>
                  <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="enviado">Enviado</SelectItem><SelectItem value="aceptado">Aceptado</SelectItem><SelectItem value="rechazado">Rechazado</SelectItem></SelectContent></Select>
                </div>
              </div>
              <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.nombre.trim() || isCreating || isUpdating}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AudienciasLayout>
  );
}
