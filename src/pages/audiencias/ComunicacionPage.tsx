import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCommunication } from '@/hooks/useCommunication';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, Plus, Trash2, DollarSign, Hash, CheckCircle2 } from 'lucide-react';

const formatEUR = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const ESTADO_STYLES: Record<string, string> = { pendiente: 'bg-muted text-muted-foreground', en_curso: 'bg-blue-500/10 text-blue-600 border-blue-500/30', completada: 'bg-green-500/10 text-green-600 border-green-500/30', cancelada: 'bg-red-500/10 text-red-600 border-red-500/30' };
const ESTADO_LABELS: Record<string, string> = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada', cancelada: 'Cancelada' };
const FASES = [
  { value: 'pre-lanzamiento', label: 'Pre-lanzamiento' },
  { value: 'lanzamiento', label: 'Lanzamiento' },
  { value: 'post-lanzamiento', label: 'Post-lanzamiento' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

interface CommForm { fase: string; canal: string; accion: string; fecha_inicio: string; fecha_fin: string; presupuesto: string; estado: string; }
const emptyForm: CommForm = { fase: 'pre-lanzamiento', canal: '', accion: '', fecha_inicio: '', fecha_fin: '', presupuesto: '', estado: 'pendiente' };

export default function ComunicacionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { strategies, isLoading, createStrategy, updateStrategy, deleteStrategy, isCreating, isUpdating } = useCommunication(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CommForm>(emptyForm);

  const totalPresupuesto = strategies.reduce((s, c) => s + (Number(c.presupuesto) || 0), 0);
  const totalAcciones = strategies.length;
  const completadas = strategies.filter(c => c.estado === 'completada').length;
  const pctCompletadas = totalAcciones > 0 ? (completadas / totalAcciones) * 100 : 0;

  const openNew = (fase?: string) => { setForm({ ...emptyForm, fase: fase || 'pre-lanzamiento' }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: typeof strategies[0]) => {
    setForm({ fase: c.fase || 'pre-lanzamiento', canal: c.canal, accion: c.accion, fecha_inicio: c.fecha_inicio || '', fecha_fin: c.fecha_fin || '', presupuesto: c.presupuesto ? String(c.presupuesto) : '', estado: c.estado || 'pendiente' });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.canal.trim() || !form.accion.trim()) return;
    const payload = { fase: form.fase, canal: form.canal, accion: form.accion, fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null, presupuesto: form.presupuesto ? Number(form.presupuesto) : null, estado: form.estado };
    if (editingId) updateStrategy({ id: editingId, ...payload });
    else createStrategy(payload);
    setDialogOpen(false);
  };

  const renderTable = (items: typeof strategies, fase: string) => {
    if (items.length === 0) return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sin acciones en esta fase.
        <Button variant="link" size="sm" onClick={() => openNew(fase)} className="ml-1">Añadir acción</Button>
      </div>
    );
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Canal</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead className="text-right">Presupuesto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(c => (
            <TableRow key={c.id} className="cursor-pointer" onClick={() => openEdit(c)}>
              <TableCell className="font-medium">{c.canal}</TableCell>
              <TableCell className="max-w-[200px] truncate">{c.accion}</TableCell>
              <TableCell>{formatDate(c.fecha_inicio)}</TableCell>
              <TableCell>{formatDate(c.fecha_fin)}</TableCell>
              <TableCell className="text-right">{formatEUR(Number(c.presupuesto) || 0)}</TableCell>
              <TableCell><Badge className={ESTADO_STYLES[c.estado || 'pendiente']}>{ESTADO_LABELS[c.estado || 'pendiente']}</Badge></TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader><AlertDialogTitle>¿Eliminar acción?</AlertDialogTitle><AlertDialogDescription>Se eliminará esta acción permanentemente.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteStrategy(c.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Comunicación</h1>
            <p className="text-muted-foreground mt-1">Estrategia de comunicación por fases.</p>
          </div>
          <Button onClick={() => openNew()}><Plus className="w-4 h-4 mr-2" />Nueva Acción</Button>
        </div>

        {/* KPIs */}
        {!isLoading && strategies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><DollarSign className="w-4 h-4 text-primary" /><CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto Total</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{formatEUR(totalPresupuesto)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><Hash className="w-4 h-4 text-primary" /><CardTitle className="text-sm font-medium text-muted-foreground">Nº de Acciones</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{totalAcciones}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><CardTitle className="text-sm font-medium text-muted-foreground">% Completadas</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{pctCompletadas.toFixed(0)}%</p></CardContent></Card>
          </div>
        )}

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        ) : strategies.length === 0 ? (
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Sin acciones de comunicación</AlertTitle>
            <AlertDescription className="text-blue-600">Planifica acciones de comunicación para cada fase del proyecto.</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="pre-lanzamiento">
            <TabsList>
              {FASES.map(f => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
            </TabsList>
            {FASES.map(f => (
              <TabsContent key={f.value} value={f.value}>
                <Card><CardContent className="p-0">
                  {renderTable(strategies.filter(s => s.fase === f.value), f.value)}
                </CardContent></Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? 'Editar Acción' : 'Nueva Acción'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Fase *</Label>
                <Select value={form.fase} onValueChange={v => setForm({ ...form, fase: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FASES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Canal *</Label><Input value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })} placeholder="Ej: Instagram, Prensa" /></div>
              <div><Label>Acción *</Label><Textarea value={form.accion} onChange={e => setForm({ ...form, accion: e.target.value })} rows={2} placeholder="Describe la acción" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha inicio</Label><Input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
                <div><Label>Fecha fin</Label><Input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Presupuesto (€)</Label><Input type="number" value={form.presupuesto} onChange={e => setForm({ ...form, presupuesto: e.target.value })} /></div>
                <div><Label>Estado</Label>
                  <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ESTADO_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.canal.trim() || !form.accion.trim() || isCreating || isUpdating}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AudienciasLayout>
  );
}
