import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFestivals } from '@/hooks/useFestivals';
import { useProject } from '@/hooks/useProject';
import { generateWithAI, extractJson } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { buildFestivalsSummaryForAI } from '@/data/festivales-catalogo';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Film, Sparkles, Loader2, Trophy, Calendar, MapPin, Target } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PRIORITY_STYLES: Record<string, string> = { alta: 'bg-red-500/10 text-red-600 border-red-500/30', media: 'bg-amber-500/10 text-amber-600 border-amber-500/30', baja: 'bg-green-500/10 text-green-600 border-green-500/30' };
const ESTADO_STYLES: Record<string, string> = { pendiente: 'bg-muted text-muted-foreground', enviado: 'bg-blue-500/10 text-blue-600 border-blue-500/30', aceptado: 'bg-green-500/10 text-green-600 border-green-500/30', rechazado: 'bg-red-500/10 text-red-600 border-red-500/30' };

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

interface FestivalForm { nombre: string; pais: string; fecha_limite: string; categoria: string; estrategia: string; prioridad: string; estado: string; notas: string; }
const emptyForm: FestivalForm = { nombre: '', pais: '', fecha_limite: '', categoria: '', estrategia: '', prioridad: 'media', estado: 'pendiente', notas: '' };

interface AIRecommendation {
  nombre: string;
  pais: string;
  categoria: string;
  prioridad: 'alta' | 'media' | 'baja';
  estrategia: string;
  meses: string;
  razones: string;
}

export default function FestivalesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { toast } = useToast();
  const { festivals, isLoading, createFestival, createFestivalAsync, updateFestival, deleteFestival, isCreating, isUpdating, setSuppressToasts } = useFestivals(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FestivalForm>(emptyForm);
  const [isImporting, setIsImporting] = useState(false);

  // AI recommendation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[] | null>(null);
  const [aiImporting, setAiImporting] = useState(false);

  // Parse suggested festivals from script analysis
  const marketPotential = project?.creative_analysis?.market_potential;
  const suggestedFestivals: string[] = (() => {
    if (!marketPotential || typeof marketPotential !== 'object' || Array.isArray(marketPotential)) return [];
    const mp = marketPotential as Record<string, unknown>;
    return Array.isArray(mp.festivales_sugeridos) ? mp.festivales_sugeridos.filter((f): f is string => typeof f === 'string') : [];
  })();
  const hasUnimportedSuggestions = suggestedFestivals.length > 0 && festivals.length === 0;

  const importFromAnalysis = async () => {
    if (suggestedFestivals.length === 0) return;
    setIsImporting(true);
    setSuppressToasts(true);
    try {
      for (const nombre of suggestedFestivals) {
        await createFestivalAsync({ nombre, prioridad: 'media', estado: 'pendiente' });
      }
      toast({ title: 'Importados', description: `${suggestedFestivals.length} festivales añadidos` });
    } catch {
      // Individual mutation errors handled by hook's onError
    } finally {
      setIsImporting(false);
      setSuppressToasts(false);
    }
  };

  // ── AI Festival Matching ────────────────────────────────────────────

  const buildProjectContext = (): string => {
    if (!project) return '';
    const parts: string[] = [];
    parts.push(`Proyecto: "${project.title}"`);
    if (project.logline) parts.push(`Logline: ${project.logline}`);
    if (project.genero) parts.push(`Género: ${project.genero}`);
    if (project.tono) parts.push(`Tono: ${project.tono}`);

    const analysis = project.creative_analysis;
    if (analysis) {
      if (analysis.central_theme) parts.push(`Tema central: ${analysis.central_theme}`);
      if (analysis.score_comercial != null) parts.push(`Score comercial: ${analysis.score_comercial}/100`);
      if (analysis.score_festival != null) parts.push(`Score festival: ${analysis.score_festival}/100`);
      if (analysis.estimated_budget_range) parts.push(`Rango presupuesto: ${analysis.estimated_budget_range}`);
      if (analysis.potencial_comercial) parts.push(`Potencial comercial: ${analysis.potencial_comercial}`);

      const mp = analysis.market_potential as Record<string, unknown> | null;
      if (mp && typeof mp === 'object' && !Array.isArray(mp)) {
        if (Array.isArray(mp.territorios_principales)) parts.push(`Territorios objetivo: ${(mp.territorios_principales as string[]).join(', ')}`);
        if (Array.isArray(mp.plataformas_potenciales)) parts.push(`Plataformas: ${(mp.plataformas_potenciales as string[]).join(', ')}`);
        if (Array.isArray(mp.festivales_sugeridos)) parts.push(`Festivales ya sugeridos: ${(mp.festivales_sugeridos as string[]).join(', ')}`);
        if (typeof mp.genero_tendencia === 'string') parts.push(`Tendencia del género: ${mp.genero_tendencia}`);
      }

      if (analysis.dafo && typeof analysis.dafo === 'object') {
        const dafo = analysis.dafo as Record<string, unknown>;
        if (Array.isArray(dafo.fortalezas)) parts.push(`Fortalezas: ${(dafo.fortalezas as string[]).slice(0, 3).join('; ')}`);
        if (Array.isArray(dafo.oportunidades)) parts.push(`Oportunidades: ${(dafo.oportunidades as string[]).slice(0, 3).join('; ')}`);
      }
    }

    return parts.join('\n');
  };

  const handleAIRecommend = async () => {
    setAiLoading(true);
    setAiRecommendations(null);
    try {
      const projectContext = buildProjectContext();
      if (!projectContext) {
        toast({ title: 'Sin datos', description: 'Analiza el guión primero para obtener recomendaciones.', variant: 'destructive' });
        setAiLoading(false);
        return;
      }

      const festivalsCatalog = buildFestivalsSummaryForAI();

      const text = await generateWithAI({
        prompt: `Recomienda los festivales más adecuados para este proyecto cinematográfico español. Cruza los datos del proyecto con el catálogo de festivales.\n\nDATOS DEL PROYECTO:\n${projectContext}\n\nCATÁLOGO DE FESTIVALES DISPONIBLES (solo relevancia alta/media para España):\n${festivalsCatalog}`,
        systemPrompt: `Eres un estratega de distribución cinematográfica especializado en el circuito de festivales internacionales y español. Conoces los criterios de selección, plazos, y perfiles ideales de cada festival.

TAREA: Selecciona 8-12 festivales del catálogo que mejor encajen con el proyecto. Ordénalos por prioridad estratégica (no alfabéticamente).

CRITERIOS DE MATCHING:
1. GÉNERO/ESPECIALIDAD: El género del proyecto debe coincidir con las líneas programáticas del festival
2. SCORE FESTIVAL: Si score ≥ 70, prioriza festivales clase A y especializados de prestigio
3. SCORE COMERCIAL: Si score ≥ 60, incluye festivales con mercado/industry (EFM, Marché, MAFIZ)
4. ÓPERA PRIMA: Si el proyecto sugiere un director novel, prioriza secciones de nuevos directores
5. TERRITORIO: Prioriza festivales en los territorios objetivo del proyecto
6. TIMING: Sugiere un calendario lógico de envíos (premiere strategy)

Para cada festival recomendado indica:
- nombre: EXACTAMENTE como aparece en el catálogo
- pais: País del festival
- categoria: Sección específica donde encajaría el proyecto
- prioridad: "alta" (must-submit), "media" (strong fit), "baja" (worth trying)
- estrategia: 2-3 frases sobre por qué este festival y qué sección, mencionando datos del proyecto
- meses: Mes(es) del festival
- razones: 1 frase con la razón principal del match

REGLAS:
- PREMIERE STRATEGY: Marca 1-2 festivales como "premiere ideal" en la estrategia
- Incluir al menos 2 festivales españoles (crítico para Goya)
- Incluir al menos 1 mercado/pitching si el proyecto tiene potencial comercial
- No repetir festivales. Usar nombres EXACTOS del catálogo.
- Devuelve SOLO un JSON array, sin texto adicional.`,
        maxTokens: 4000,
      });

      const recommendations = extractJson<AIRecommendation[]>(text);
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('No se generaron recomendaciones válidas');
      }
      setAiRecommendations(recommendations);
      toast({ title: 'IA completada', description: `${recommendations.length} festivales recomendados` });
    } catch (err: unknown) {
      toast({ title: 'Error de IA', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleImportAIRecommendations = async () => {
    if (!aiRecommendations || aiRecommendations.length === 0) return;
    setAiImporting(true);
    setSuppressToasts(true);
    try {
      for (const rec of aiRecommendations) {
        await createFestivalAsync({
          nombre: rec.nombre,
          pais: rec.pais || null,
          categoria: rec.categoria || null,
          prioridad: rec.prioridad || 'media',
          estado: 'pendiente',
          estrategia: rec.estrategia || null,
          notas: rec.razones ? `IA: ${rec.razones}${rec.meses ? ` | Festival: ${rec.meses}` : ''}` : null,
        });
      }
      toast({ title: 'Importados', description: `${aiRecommendations.length} festivales añadidos a tu estrategia` });
      setAiRecommendations(null);
    } catch {
      // Individual errors handled by hook
    } finally {
      setAiImporting(false);
      setSuppressToasts(false);
    }
  };

  // ── CRUD helpers ────────────────────────────────────────────────────

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

  const hasAnalysis = !!project?.creative_analysis;

  return (
    <AudienciasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Festivales"
          description="Estrategia de festivales y mercados."
          actions={
            <div className="flex gap-2">
              {hasAnalysis && (
                <Button variant="outline" onClick={handleAIRecommend} disabled={aiLoading}>
                  {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</> : <><Sparkles className="w-4 h-4 mr-2" />Recomendar con IA</>}
                </Button>
              )}
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo Festival</Button>
            </div>
          }
        />

        {/* AI Recommendations Panel */}
        {aiRecommendations && aiRecommendations.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Festivales Recomendados por IA ({aiRecommendations.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAiRecommendations(null)}>Descartar</Button>
                  <Button size="sm" onClick={handleImportAIRecommendations} disabled={aiImporting}>
                    {aiImporting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Importando...</> : <><Plus className="w-3 h-3 mr-1" />Importar todos</>}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiRecommendations.map((rec, i) => (
                  <div key={i} className="bg-background rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{rec.nombre}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {rec.pais && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.pais}</span>}
                          {rec.meses && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{rec.meses}</span>}
                        </div>
                      </div>
                      <Badge className={PRIORITY_STYLES[rec.prioridad || 'media']} >{rec.prioridad}</Badge>
                    </div>
                    {rec.categoria && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{rec.categoria}</span>
                      </div>
                    )}
                    {rec.estrategia && <p className="text-xs leading-relaxed">{rec.estrategia}</p>}
                    {rec.razones && <p className="text-xs text-primary/80 italic">{rec.razones}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Suggestions from Script Analysis (simple import) */}
        {hasUnimportedSuggestions && !aiRecommendations && (
          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-medium">Festivales sugeridos por el análisis</AlertTitle>
            <AlertDescription>
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                {suggestedFestivals.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={importFromAnalysis} disabled={isImporting}>
                  {isImporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                  Importar rápido
                </Button>
                {hasAnalysis && (
                  <Button size="sm" variant="outline" onClick={handleAIRecommend} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Análisis completo con IA
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* No analysis hint */}
        {!hasAnalysis && festivals.length === 0 && !isLoading && (
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertTitle className="text-sm font-medium">Recomendación</AlertTitle>
            <AlertDescription className="text-sm">
              Analiza tu guión primero para obtener recomendaciones inteligentes de festivales basadas en el género, temática y potencial de tu proyecto.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card><CardContent className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
        ) : festivals.length === 0 && !aiRecommendations ? (
          <EmptyState
            icon={Film}
            title="Sin festivales"
            description={hasAnalysis ? "Usa 'Recomendar con IA' para obtener una estrategia de festivales personalizada, o añade festivales manualmente." : "Añade festivales para planificar tu estrategia de lanzamiento."}
            actionLabel={hasAnalysis ? "Recomendar con IA" : "Nuevo Festival"}
            onAction={hasAnalysis ? handleAIRecommend : openNew}
          />
        ) : festivals.length > 0 ? (
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
        ) : null}

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
