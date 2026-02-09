import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { useProject } from '@/hooks/useProject';
import ConvocatoriasLayout from '@/components/layout/ConvocatoriasLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Info, Search, ExternalLink, Send } from 'lucide-react';

const formatEUR = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const AMBITO_STYLES: Record<string, string> = {
  estatal: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  autonomica: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  europea: 'bg-green-500/10 text-green-600 border-green-500/30',
  iberoamericana: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  privada: 'bg-muted text-muted-foreground',
};

const AMBITOS = ['estatal', 'autonomica', 'europea', 'iberoamericana', 'privada'];
const TIPOS = ['largometraje', 'cortometraje', 'documental', 'produccion', 'distribucion', 'guion'];

export default function BibliotecaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  const [search, setSearch] = useState('');
  const [selectedAmbitos, setSelectedAmbitos] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [soloActivas, setSoloActivas] = useState(true);

  const { data: convocatorias, isLoading } = useConvocatorias({
    search: search || undefined,
    ambitos: selectedAmbitos.length ? selectedAmbitos : undefined,
    tiposObra: selectedTipos.length ? selectedTipos : undefined,
    soloActivas,
  });

  const { createSolicitud, isCreating } = useSolicitudes(projectId);

  const [selectedConv, setSelectedConv] = useState<typeof convocatorias extends (infer T)[] | undefined ? T : never>(null as any);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [solicitudDialog, setSolicitudDialog] = useState(false);
  const [importeSolicitado, setImporteSolicitado] = useState('');

  const openDetail = (c: NonNullable<typeof convocatorias>[0]) => {
    setSelectedConv(c);
    setSheetOpen(true);
  };

  const handleSolicitar = () => {
    if (!selectedConv) return;
    createSolicitud({
      convocatoria_id: selectedConv.id,
      importe_solicitado: importeSolicitado ? Number(importeSolicitado) : null,
    });
    setSolicitudDialog(false);
    setImporteSolicitado('');
  };

  const toggleAmbito = (a: string) => setSelectedAmbitos(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleTipo = (t: string) => setSelectedTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <ConvocatoriasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Biblioteca de Convocatorias</h1>
          <p className="text-muted-foreground mt-1">Catálogo de ayudas y convocatorias disponibles.</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <div className="hidden md:block w-56 shrink-0 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Ámbito</p>
              <div className="space-y-2">
                {AMBITOS.map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedAmbitos.includes(a)} onCheckedChange={() => toggleAmbito(a)} />
                    <span className="capitalize">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tipo de obra</p>
              <div className="space-y-2">
                {TIPOS.map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedTipos.includes(t)} onCheckedChange={() => toggleTipo(t)} />
                    <span className="capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={soloActivas} onCheckedChange={setSoloActivas} />
              <Label className="text-sm">Solo activas</Label>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile search */}
            <div className="md:hidden mb-4 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
            </div>

            {isLoading ? (
              <Card><CardContent className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
            ) : !convocatorias?.length ? (
              <Alert className="border-blue-500/30 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-700">Sin resultados</AlertTitle>
                <AlertDescription className="text-blue-600">No se encontraron convocatorias con los filtros actuales.</AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Organismo</TableHead>
                        <TableHead>Ámbito</TableHead>
                        <TableHead>Tipos</TableHead>
                        <TableHead className="text-right">Dotación</TableHead>
                        <TableHead>Cierre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convocatorias.map(c => (
                        <TableRow key={c.id} className="cursor-pointer" onClick={() => openDetail(c)}>
                          <TableCell className="font-medium max-w-[200px] truncate">{c.nombre}</TableCell>
                          <TableCell>{c.organismo}</TableCell>
                          <TableCell><Badge className={AMBITO_STYLES[c.ambito] || ''}>{c.ambito}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(c.tipos_obra as string[])?.slice(0, 2).map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                              {(c.tipos_obra as string[])?.length > 2 && <Badge variant="outline" className="text-xs">+{(c.tipos_obra as string[]).length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{c.dotacion ? formatEUR(Number(c.dotacion)) : '—'}</TableCell>
                          <TableCell>{formatDate(c.fecha_cierre)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="overflow-y-auto">
            {selectedConv && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedConv.nombre}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div className="flex gap-2">
                    <Badge className={AMBITO_STYLES[selectedConv.ambito] || ''}>{selectedConv.ambito}</Badge>
                    {selectedConv.activa && <Badge variant="outline" className="text-green-600 border-green-500/30">Activa</Badge>}
                  </div>
                  <div><p className="text-sm font-medium text-muted-foreground">Organismo</p><p className="text-sm">{selectedConv.organismo}</p></div>
                  {selectedConv.descripcion && <div><p className="text-sm font-medium text-muted-foreground">Descripción</p><p className="text-sm">{selectedConv.descripcion}</p></div>}
                  {selectedConv.requisitos && <div><p className="text-sm font-medium text-muted-foreground">Requisitos</p><p className="text-sm">{selectedConv.requisitos}</p></div>}
                  {selectedConv.dotacion && <div><p className="text-sm font-medium text-muted-foreground">Dotación</p><p className="text-lg font-bold">{formatEUR(Number(selectedConv.dotacion))}</p></div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">Apertura</p><p className="text-sm">{formatDate(selectedConv.fecha_apertura)}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Cierre</p><p className="text-sm">{formatDate(selectedConv.fecha_cierre)}</p></div>
                  </div>
                  {(selectedConv.tipos_obra as string[])?.length > 0 && (
                    <div><p className="text-sm font-medium text-muted-foreground mb-1">Tipos de obra</p><div className="flex flex-wrap gap-1">{(selectedConv.tipos_obra as string[]).map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div></div>
                  )}
                  {selectedConv.url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(selectedConv.url!, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />Web oficial
                    </Button>
                  )}
                  <Button className="w-full" onClick={() => setSolicitudDialog(true)}>
                    <Send className="w-4 h-4 mr-2" />Solicitar para este proyecto
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Solicitud Dialog */}
        <Dialog open={solicitudDialog} onOpenChange={setSolicitudDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Solicitud</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Convocatoria: <span className="font-medium text-foreground">{selectedConv?.nombre}</span></p>
              <div><Label>Importe a solicitar (€)</Label><Input type="number" value={importeSolicitado} onChange={e => setImporteSolicitado(e.target.value)} placeholder="Ej: 150000" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSolicitudDialog(false)}>Cancelar</Button>
              <Button onClick={handleSolicitar} disabled={isCreating}>{isCreating ? 'Creando...' : 'Crear Solicitud'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ConvocatoriasLayout>
  );
}
