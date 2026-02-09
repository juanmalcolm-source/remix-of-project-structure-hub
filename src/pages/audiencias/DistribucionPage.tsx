import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDistribution } from '@/hooks/useDistribution';
import { useProject } from '@/hooks/useProject';
import AudienciasLayout from '@/components/layout/AudienciasLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, Plus, Trash2, DollarSign } from 'lucide-react';

const formatEUR = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface DistForm { canal: string; territorio: string; ventana: string; estrategia: string; ingreso_estimado: string; }
const emptyForm: DistForm = { canal: '', territorio: '', ventana: '', estrategia: '', ingreso_estimado: '' };

export default function DistribucionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { plans, isLoading, createPlan, updatePlan, deletePlan, isCreating, isUpdating } = useDistribution(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DistForm>(emptyForm);

  const totalIngreso = plans.reduce((s, p) => s + (Number(p.ingreso_estimado) || 0), 0);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (p: typeof plans[0]) => {
    setForm({ canal: p.canal, territorio: p.territorio || '', ventana: p.ventana || '', estrategia: p.estrategia || '', ingreso_estimado: p.ingreso_estimado ? String(p.ingreso_estimado) : '' });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.canal.trim()) return;
    const payload = { canal: form.canal, territorio: form.territorio || null, ventana: form.ventana || null, estrategia: form.estrategia || null, ingreso_estimado: form.ingreso_estimado ? Number(form.ingreso_estimado) : null };
    if (editingId) updatePlan({ id: editingId, ...payload });
    else createPlan(payload);
    setDialogOpen(false);
  };

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Distribución</h1>
            <p className="text-muted-foreground mt-1">Planes de distribución por canal y territorio.</p>
          </div>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo Plan</Button>
        </div>

        {/* KPI */}
        {!isLoading && plans.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Total Estimado</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatEUR(totalIngreso)}</p></CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        ) : plans.length === 0 ? (
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Sin planes de distribución</AlertTitle>
            <AlertDescription className="text-blue-600">Añade canales de distribución para planificar los ingresos del proyecto.</AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Territorio</TableHead>
                    <TableHead>Ventana</TableHead>
                    <TableHead>Estrategia</TableHead>
                    <TableHead className="text-right">Ingreso estimado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                      <TableCell className="font-medium">{p.canal}</TableCell>
                      <TableCell>{p.territorio || '—'}</TableCell>
                      <TableCell>{p.ventana || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.estrategia || '—'}</TableCell>
                      <TableCell className="text-right">{formatEUR(Number(p.ingreso_estimado) || 0)}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={e => e.stopPropagation()}>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle><AlertDialogDescription>Se eliminará el plan de "{p.canal}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePlan(p.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
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
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Canal *</Label><Input value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })} placeholder="Ej: Salas de cine" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Territorio</Label><Input value={form.territorio} onChange={e => setForm({ ...form, territorio: e.target.value })} placeholder="Ej: España" /></div>
                <div><Label>Ventana</Label><Input value={form.ventana} onChange={e => setForm({ ...form, ventana: e.target.value })} placeholder="Ej: Estreno" /></div>
              </div>
              <div><Label>Estrategia</Label><Textarea value={form.estrategia} onChange={e => setForm({ ...form, estrategia: e.target.value })} rows={3} /></div>
              <div><Label>Ingreso estimado (€)</Label><Input type="number" value={form.ingreso_estimado} onChange={e => setForm({ ...form, ingreso_estimado: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.canal.trim() || isCreating || isUpdating}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AudienciasLayout>
  );
}
