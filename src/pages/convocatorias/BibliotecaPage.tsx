import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { useProject } from '@/hooks/useProject';
import ConvocatoriasLayout from '@/components/layout/ConvocatoriasLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import UploadBasesDialog from '@/components/convocatorias/UploadBasesDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ExternalLink, Send, Library, Plus, FileDown, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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

function renderList(items: unknown): string[] {
  if (Array.isArray(items)) return items.map(String);
  return [];
}

export default function BibliotecaPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const queryClient = useQueryClient();

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

  const [selectedConv, setSelectedConv] = useState<NonNullable<typeof convocatorias>[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [solicitudDialog, setSolicitudDialog] = useState(false);
  const [importeSolicitado, setImporteSolicitado] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

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

  const basesResumen = selectedConv?.bases_resumen ?? null;
  const basesPdfUrl = selectedConv?.bases_pdf_url ?? null;

  return (
    <ConvocatoriasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Biblioteca de Convocatorias"
          description="Catálogo de ayudas y convocatorias disponibles."
          actions={
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />Nueva Convocatoria
            </Button>
          }
        />

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
            <div className="md:hidden mb-4 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
            </div>

            {isLoading ? (
              <Card><CardContent className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
            ) : !convocatorias?.length ? (
              <EmptyState
                icon={Library}
                title="Sin resultados"
                description="No se encontraron convocatorias con los filtros actuales."
                actionLabel="Añadir convocatoria"
                onAction={() => setUploadOpen(true)}
              />
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
          <SheetContent className="overflow-y-auto w-[420px] sm:max-w-[420px]">
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
                  {selectedConv.requisitos && <div><p className="text-sm font-medium text-muted-foreground">Requisitos</p><p className="text-sm whitespace-pre-line">{selectedConv.requisitos}</p></div>}
                  {selectedConv.dotacion && <div><p className="text-sm font-medium text-muted-foreground">Dotación</p><p className="text-lg font-bold">{formatEUR(Number(selectedConv.dotacion))}</p></div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">Apertura</p><p className="text-sm">{formatDate(selectedConv.fecha_apertura)}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Cierre</p><p className="text-sm">{formatDate(selectedConv.fecha_cierre)}</p></div>
                  </div>
                  {(selectedConv.tipos_obra as string[])?.length > 0 && (
                    <div><p className="text-sm font-medium text-muted-foreground mb-1">Tipos de obra</p><div className="flex flex-wrap gap-1">{(selectedConv.tipos_obra as string[]).map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}</div></div>
                  )}

                  {/* PDF link */}
                  {basesPdfUrl && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(basesPdfUrl, '_blank')}>
                      <FileDown className="w-4 h-4 mr-2" />Ver bases (PDF)
                    </Button>
                  )}

                  {/* AI Summary Accordion */}
                  {basesResumen && (
                    <div className="border rounded-lg">
                      <div className="flex items-center gap-2 p-3 border-b">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">Resumen IA de las bases</span>
                      </div>
                      <Accordion type="multiple" className="px-1">
                        {renderList(basesResumen.requisitos).length > 0 && (
                          <AccordionItem value="requisitos">
                            <AccordionTrigger className="text-sm py-2 px-2">Requisitos ({renderList(basesResumen.requisitos).length})</AccordionTrigger>
                            <AccordionContent className="px-2">
                              <ul className="space-y-1 text-sm">
                                {renderList(basesResumen.requisitos).map((r, i) => <li key={i} className="flex gap-2"><span className="text-primary mt-0.5">•</span>{r}</li>)}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {renderList(basesResumen.criterios_valoracion).length > 0 && (
                          <AccordionItem value="criterios">
                            <AccordionTrigger className="text-sm py-2 px-2">Criterios de valoración ({renderList(basesResumen.criterios_valoracion).length})</AccordionTrigger>
                            <AccordionContent className="px-2">
                              <ul className="space-y-1 text-sm">
                                {renderList(basesResumen.criterios_valoracion).map((c, i) => <li key={i} className="flex gap-2"><span className="text-primary mt-0.5">•</span>{c}</li>)}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {renderList(basesResumen.documentacion_requerida).length > 0 && (
                          <AccordionItem value="docs">
                            <AccordionTrigger className="text-sm py-2 px-2">Documentación requerida ({renderList(basesResumen.documentacion_requerida).length})</AccordionTrigger>
                            <AccordionContent className="px-2">
                              <ul className="space-y-1 text-sm">
                                {renderList(basesResumen.documentacion_requerida).map((d, i) => <li key={i} className="flex gap-2"><span className="text-primary mt-0.5">•</span>{d}</li>)}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {renderList(basesResumen.notas_importantes).length > 0 && (
                          <AccordionItem value="notas">
                            <AccordionTrigger className="text-sm py-2 px-2">Notas importantes ({renderList(basesResumen.notas_importantes).length})</AccordionTrigger>
                            <AccordionContent className="px-2">
                              <ul className="space-y-1 text-sm">
                                {renderList(basesResumen.notas_importantes).map((n, i) => <li key={i} className="flex gap-2"><span className="text-amber-500 mt-0.5">⚠</span>{n}</li>)}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
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

        {/* Upload Bases Dialog */}
        <UploadBasesDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['convocatorias'] })}
        />
      </div>
    </ConvocatoriasLayout>
  );
}
