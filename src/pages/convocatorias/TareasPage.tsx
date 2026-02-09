import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ListChecks, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { useTareasSolicitud } from '@/hooks/useTareasSolicitud';
import { useProject } from '@/hooks/useProject';
import ConvocatoriasLayout from '@/components/layout/ConvocatoriasLayout';

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  urgente: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  en_progreso: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const isOverdue = (d: string | null, estado: string | null) => d && estado !== 'completada' && new Date(d) < new Date();

const emptyForm = { titulo: '', descripcion: '', fecha_limite: '', prioridad: 'media', estado: 'pendiente' };

export default function TareasPage() {
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const { solicitudes, isLoading: solLoading } = useSolicitudes(projectId);

  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string>('');
  const { tareas, isLoading, createTarea, updateTarea, deleteTarea } = useTareasSolicitud(selectedSolicitudId || undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTarea, setEditingTarea] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Auto-select first solicitud
  const effectiveSolicitudId = selectedSolicitudId || solicitudes[0]?.id || '';

  const filteredTareas = tareas
    .filter((t) => filtroEstado === 'todas' || t.estado === filtroEstado)
    .sort((a, b) => {
      const aOverdue = isOverdue(a.fecha_limite, a.estado) ? 0 : 1;
      const bOverdue = isOverdue(b.fecha_limite, b.estado) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      if (!a.fecha_limite) return 1;
      if (!b.fecha_limite) return -1;
      return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
    });

  const total = tareas.length;
  const pendientes = tareas.filter((t) => t.estado === 'pendiente').length;
  const enProgreso = tareas.filter((t) => t.estado === 'en_progreso').length;
  const completadas = tareas.filter((t) => t.estado === 'completada').length;
  const vencidas = tareas.filter((t) => isOverdue(t.fecha_limite, t.estado)).length;

  const openCreate = () => { setEditingTarea(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: any) => {
    setEditingTarea(t);
    setForm({ titulo: t.titulo, descripcion: t.descripcion || '', fecha_limite: t.fecha_limite || '', prioridad: t.prioridad || 'media', estado: t.estado || 'pendiente' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) return;
    const payload: any = { ...form, fecha_limite: form.fecha_limite || null, descripcion: form.descripcion || null };
    if (editingTarea) {
      updateTarea({ id: editingTarea.id, ...payload });
    } else {
      createTarea(payload);
    }
    setDialogOpen(false);
  };

  const handleToggleComplete = (t: any) => {
    updateTarea({ id: t.id, estado: t.estado === 'completada' ? 'pendiente' : 'completada' });
  };

  return (
    <ConvocatoriasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Tareas</h2>
            <p className="text-muted-foreground">Gestiona las tareas de tus solicitudes</p>
          </div>
          {effectiveSolicitudId && (
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nueva Tarea</Button>
          )}
        </div>

        {solLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : solicitudes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin solicitudes</h3>
              <p className="text-muted-foreground">Crea una solicitud en el Workspace para gestionar tareas</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Selector solicitud */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Solicitud:</Label>
              <Select value={effectiveSolicitudId} onValueChange={setSelectedSolicitudId}>
                <SelectTrigger className="w-80"><SelectValue placeholder="Selecciona solicitud" /></SelectTrigger>
                <SelectContent>
                  {solicitudes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.convocatorias?.nombre || 'Solicitud'} — {s.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* KPIs */}
            {effectiveSolicitudId && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total', value: total },
                  { label: 'Pendientes', value: pendientes },
                  { label: 'En progreso', value: enProgreso },
                  { label: 'Completadas', value: completadas },
                  { label: 'Vencidas', value: vencidas, danger: vencidas > 0 },
                ].map((kpi) => (
                  <Card key={kpi.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className={`text-2xl font-bold ${kpi.danger ? 'text-destructive' : ''}`}>{kpi.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Filtro */}
            {effectiveSolicitudId && (
              <div className="flex items-center gap-3">
                <Label className="text-sm">Filtrar:</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Table */}
            {effectiveSolicitudId && (
              isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filteredTareas.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Sin tareas {filtroEstado !== 'todas' ? `con estado "${filtroEstado}"` : ''}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha límite</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTareas.map((t) => (
                        <TableRow key={t.id} className="cursor-pointer" onClick={() => openEdit(t)}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={t.estado === 'completada'} onCheckedChange={() => handleToggleComplete(t)} />
                          </TableCell>
                          <TableCell className={t.estado === 'completada' ? 'line-through text-muted-foreground' : 'font-medium'}>{t.titulo}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{t.descripcion || '—'}</TableCell>
                          <TableCell>
                            <span className={isOverdue(t.fecha_limite, t.estado) ? 'text-destructive font-medium flex items-center gap-1' : ''}>
                              {isOverdue(t.fecha_limite, t.estado) && <AlertCircle className="w-3 h-3" />}
                              {formatDate(t.fecha_limite)}
                            </span>
                          </TableCell>
                          <TableCell><Badge className={PRIORIDAD_COLORS[t.prioridad || 'media']}>{t.prioridad}</Badge></TableCell>
                          <TableCell><Badge className={ESTADO_COLORS[t.estado || 'pendiente']}>{t.estado?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
            <div><Label>Fecha límite</Label><Input type="date" value={form.fecha_limite} onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.titulo.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteTarea(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConvocatoriasLayout>
  );
}
