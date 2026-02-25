import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  AlertTriangle,
  Swords,
  Gauge,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateCreativeAnalysis } from '@/hooks/useProject';
import { Json } from '@/integrations/supabase/types';

interface ActStructure { acto: number; nombre: string; descripcion: string; }
interface TurningPoint { nombre: string; descripcion: string; momento?: string; pagina_aproximada?: number; }
interface EmotionalPoint { momento: string; emocion: string; intensidad: number; }
interface NarrativeError {
  tipo: string;
  gravedad: string;
  ubicacion: string;
  pagina_aproximada?: number;
  descripcion: string;
  sugerencia_correccion: string;
}
interface Conflict {
  tipo: string;
  descripcion: string;
  personajes_involucrados: string[];
  detonante: string;
  desarrollo: string;
  resolucion: string;
  resuelto: boolean;
}
interface InternalConflict {
  personaje: string;
  conflicto: string;
  manifestacion: string;
  evolucion: string;
}
interface TensionPoint {
  pagina_aproximada: number;
  nivel_tension: number;
  descripcion: string;
  conflicto_asociado: string;
}
interface ConflictsAnalysis {
  conflicto_principal: Conflict;
  conflictos_secundarios: Conflict[];
  conflictos_internos: InternalConflict[];
  mapa_tensiones: TensionPoint[];
}
interface PacingSection { paginas: string; descripcion: string; sugerencia?: string; }
interface PacingAnalysis {
  ritmo_general: string;
  observaciones: string;
  secciones_lentas: PacingSection[];
  secciones_rapidas: PacingSection[];
  equilibrio_dialogo_accion: string;
}
interface AnalyzedTheme {
  nombre: string;
  descripcion: string;
  como_se_desarrolla: string;
  escenas_clave: string[];
}
interface Symbolism { elemento: string; significado: string; apariciones: string[]; }
interface ThematicAnalysis {
  tema_principal: AnalyzedTheme;
  temas_secundarios: AnalyzedTheme[];
  simbolismos: Symbolism[];
  mensaje_universal: string;
}

function parseJsonArray<T>(data: Json | null | undefined): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data as T[];
}

function parseJsonObject<T>(data: Json | null | undefined): T | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as T;
}

export default function NarrativoPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error } = useProject(projectId);
  const updateAnalysis = useUpdateCreativeAnalysis();

  const [actStructure, setActStructure] = useState<ActStructure[]>([]);
  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    conflicts: true,
    pacing: false,
    thematic: false,
  });

  useEffect(() => {
    if (project?.creative_analysis) {
      setActStructure(parseJsonArray<ActStructure>(project.creative_analysis.act_structure));
      setTurningPoints(parseJsonArray<TurningPoint>(project.creative_analysis.turning_points));
    }
  }, [project]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAct = async (index: number, descripcion: string) => {
    if (!projectId) return;
    const updated = [...actStructure];
    updated[index] = { ...updated[index], descripcion };
    setActStructure(updated);
    setIsSaving(true);
    try {
      await updateAnalysis.mutateAsync({ projectId, data: { act_structure: updated as unknown as Json } });
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch { toast({ title: 'Error al guardar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <CreativeLayout projectTitle="Cargando..."><PageSkeleton variant="cards" /></CreativeLayout>;
  if (error || !project) return <CreativeLayout projectTitle="Error"><ErrorState message="No se pudo cargar el proyecto" /></CreativeLayout>;

  const analysis = project.creative_analysis;
  const narrativeErrors = parseJsonArray<NarrativeError>(analysis?.narrative_errors);
  const conflictsAnalysis = parseJsonObject<ConflictsAnalysis>(analysis?.conflicts_analysis);
  const pacingAnalysis = parseJsonObject<PacingAnalysis>(analysis?.pacing_analysis);
  const thematicAnalysis = parseJsonObject<ThematicAnalysis>(analysis?.thematic_analysis);
  const emotionalCurve = parseJsonArray<EmotionalPoint>(analysis?.emotional_curve);

  const hasBasicAnalysis = actStructure.length > 0 || turningPoints.length > 0;
  const hasDeepAnalysis = narrativeErrors.length > 0 || conflictsAnalysis || pacingAnalysis || thematicAnalysis;
  const hasAnyAnalysis = hasBasicAnalysis || hasDeepAnalysis;

  const severityConfig: Record<string, { color: string; label: string }> = {
    critico: { color: 'bg-red-600 text-white', label: 'Crítico' },
    importante: { color: 'bg-orange-500 text-white', label: 'Importante' },
    menor: { color: 'bg-yellow-500 text-black', label: 'Menor' },
    sugerencia: { color: 'bg-blue-500 text-white', label: 'Sugerencia' },
  };

  const conflictTypeLabels: Record<string, string> = {
    persona_vs_persona: 'Persona vs Persona',
    persona_vs_sociedad: 'Persona vs Sociedad',
    persona_vs_naturaleza: 'Persona vs Naturaleza',
    persona_vs_si_mismo: 'Persona vs Sí mismo',
    persona_vs_destino: 'Persona vs Destino',
    persona_vs_tecnologia: 'Persona vs Tecnología',
  };

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">Análisis Narrativo</h2>
            <p className="text-muted-foreground">
              Estructura dramática, errores, conflictos y temática
              {analysis?.analysis_version && (
                <Badge variant="outline" className="ml-2 text-xs">v{analysis.analysis_version as string}</Badge>
              )}
            </p>
          </div>
        </div>

        {!hasAnyAnalysis ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin análisis narrativo</h3>
              <p className="text-muted-foreground">
                Analiza un guión para generar automáticamente la estructura dramática completa.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ═══ ERRORES NARRATIVOS ═══ */}
            {narrativeErrors.length > 0 && (
              <Card className="border-orange-500/30">
                <CardHeader
                  className="bg-orange-500/10 cursor-pointer"
                  onClick={() => toggleSection('errors')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Errores Narrativos ({narrativeErrors.length})
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                    <span className="ml-auto">
                      {expandedSections.errors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </CardTitle>
                </CardHeader>
                {expandedSections.errors && (
                  <CardContent className="pt-4 space-y-4">
                    {narrativeErrors.map((err, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={severityConfig[err.gravedad]?.color || 'bg-gray-500 text-white'}>
                            {severityConfig[err.gravedad]?.label || err.gravedad}
                          </Badge>
                          <Badge variant="outline">{err.tipo}</Badge>
                          {err.pagina_aproximada && (
                            <span className="text-xs text-muted-foreground">p. {err.pagina_aproximada}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{err.ubicacion}</span>
                        </div>
                        <p className="text-sm">{err.descripcion}</p>
                        <div className="bg-green-500/5 border border-green-500/20 rounded p-2">
                          <p className="text-xs text-green-700 dark:text-green-400">
                            <strong>Sugerencia:</strong> {err.sugerencia_correccion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* ═══ ESTRUCTURA DE ACTOS ═══ */}
            {actStructure.length > 0 && (
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    Estructura de Actos
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {actStructure.map((acto, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {acto.acto || index + 1}
                          </div>
                          <span className="font-medium">{acto.nombre || `Acto ${index + 1}`}</span>
                        </div>
                        <Textarea
                          value={acto.descripcion || ''}
                          onChange={(e) => {
                            const u = [...actStructure];
                            u[index] = { ...u[index], descripcion: e.target.value };
                            setActStructure(u);
                          }}
                          onBlur={(e) => handleSaveAct(index, e.target.value)}
                          placeholder="Descripción del acto..."
                          rows={4}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ PUNTOS DE GIRO ═══ */}
            {turningPoints.length > 0 && (
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    Puntos de Giro
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {turningPoints.map((point, index) => (
                      <div key={index} className="flex gap-4 items-start border-l-4 border-primary pl-4">
                        <div>
                          <h4 className="font-medium">{point.nombre}</h4>
                          {(point.momento || point.pagina_aproximada) && (
                            <span className="text-xs text-muted-foreground">
                              {point.momento}{point.pagina_aproximada ? ` (p. ${point.pagina_aproximada})` : ''}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">{point.descripcion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ CURVA EMOCIONAL ═══ */}
            {emotionalCurve.length > 0 && (
              <Card>
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    Curva Emocional
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {emotionalCurve.map((point, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-muted-foreground truncate">{point.momento}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all"
                                style={{ width: `${(point.intensidad / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-6 text-right">{point.intensidad}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{point.emocion}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ CONFLICTOS ═══ */}
            {conflictsAnalysis && (
              <Card>
                <CardHeader
                  className="bg-red-500/5 cursor-pointer"
                  onClick={() => toggleSection('conflicts')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-red-500" />
                    Mapa de Conflictos
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                    <span className="ml-auto">
                      {expandedSections.conflicts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </CardTitle>
                </CardHeader>
                {expandedSections.conflicts && (
                  <CardContent className="pt-4 space-y-6">
                    {/* Conflicto Principal */}
                    {conflictsAnalysis.conflicto_principal && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Conflicto Principal</h4>
                        <div className="border-l-4 border-red-500 pl-4 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="destructive">
                              {conflictTypeLabels[conflictsAnalysis.conflicto_principal.tipo] || conflictsAnalysis.conflicto_principal.tipo}
                            </Badge>
                            {conflictsAnalysis.conflicto_principal.resuelto && (
                              <Badge variant="outline" className="text-green-600 border-green-600">Resuelto</Badge>
                            )}
                          </div>
                          <p className="text-sm">{conflictsAnalysis.conflicto_principal.descripcion}</p>
                          {conflictsAnalysis.conflicto_principal.personajes_involucrados?.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {conflictsAnalysis.conflicto_principal.personajes_involucrados.map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                              ))}
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div><strong>Detonante:</strong> {conflictsAnalysis.conflicto_principal.detonante}</div>
                            <div><strong>Desarrollo:</strong> {conflictsAnalysis.conflicto_principal.desarrollo}</div>
                            <div><strong>Resolución:</strong> {conflictsAnalysis.conflicto_principal.resolucion}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conflictos Secundarios */}
                    {conflictsAnalysis.conflictos_secundarios?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                          Conflictos Secundarios ({conflictsAnalysis.conflictos_secundarios.length})
                        </h4>
                        <div className="space-y-3">
                          {conflictsAnalysis.conflictos_secundarios.map((c, i) => (
                            <div key={i} className="border rounded-lg p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {conflictTypeLabels[c.tipo] || c.tipo}
                                </Badge>
                                {c.resuelto && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">Resuelto</Badge>
                                )}
                              </div>
                              <p className="text-sm">{c.descripcion}</p>
                              {c.personajes_involucrados?.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {c.personajes_involucrados.map((p, j) => (
                                    <Badge key={j} variant="secondary" className="text-xs">{p}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conflictos Internos */}
                    {conflictsAnalysis.conflictos_internos?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                          Conflictos Internos ({conflictsAnalysis.conflictos_internos.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {conflictsAnalysis.conflictos_internos.map((c, i) => (
                            <div key={i} className="border rounded-lg p-3 space-y-1">
                              <p className="font-medium text-sm">{c.personaje}</p>
                              <p className="text-sm text-muted-foreground">{c.conflicto}</p>
                              <p className="text-xs text-muted-foreground"><strong>Manifestación:</strong> {c.manifestacion}</p>
                              <p className="text-xs text-muted-foreground"><strong>Evolución:</strong> {c.evolucion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mapa de Tensiones */}
                    {conflictsAnalysis.mapa_tensiones?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Mapa de Tensiones</h4>
                        <div className="space-y-2">
                          {conflictsAnalysis.mapa_tensiones
                            .sort((a, b) => a.pagina_aproximada - b.pagina_aproximada)
                            .map((t, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-12">p. {t.pagina_aproximada}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-yellow-400 to-red-500"
                                    style={{ width: `${(t.nivel_tension / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-6">{t.nivel_tension}/10</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{t.descripcion}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* ═══ RITMO / PACING ═══ */}
            {pacingAnalysis && (
              <Card>
                <CardHeader
                  className="bg-blue-500/5 cursor-pointer"
                  onClick={() => toggleSection('pacing')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-blue-500" />
                    Análisis de Ritmo
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{pacingAnalysis.ritmo_general}</Badge>
                    <span className="ml-auto">
                      {expandedSections.pacing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </CardTitle>
                </CardHeader>
                {expandedSections.pacing && (
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-sm">{pacingAnalysis.observaciones}</p>

                    {pacingAnalysis.equilibrio_dialogo_accion && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Equilibrio Diálogo/Acción</p>
                        <p className="text-sm">{pacingAnalysis.equilibrio_dialogo_accion}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pacingAnalysis.secciones_lentas?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-amber-600 mb-2">Secciones Lentas</h4>
                          <div className="space-y-2">
                            {pacingAnalysis.secciones_lentas.map((s, i) => (
                              <div key={i} className="border border-amber-500/30 rounded p-2">
                                <p className="text-xs font-medium">Páginas {s.paginas}</p>
                                <p className="text-xs text-muted-foreground">{s.descripcion}</p>
                                {s.sugerencia && <p className="text-xs text-amber-600 mt-1">{s.sugerencia}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {pacingAnalysis.secciones_rapidas?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-600 mb-2">Secciones Rápidas</h4>
                          <div className="space-y-2">
                            {pacingAnalysis.secciones_rapidas.map((s, i) => (
                              <div key={i} className="border border-green-500/30 rounded p-2">
                                <p className="text-xs font-medium">Páginas {s.paginas}</p>
                                <p className="text-xs text-muted-foreground">{s.descripcion}</p>
                                {s.sugerencia && <p className="text-xs text-green-600 mt-1">{s.sugerencia}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* ═══ ANÁLISIS TEMÁTICO ═══ */}
            {thematicAnalysis && (
              <Card>
                <CardHeader
                  className="bg-purple-500/5 cursor-pointer"
                  onClick={() => toggleSection('thematic')}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-500" />
                    Análisis Temático
                    <Badge variant="secondary"><Sparkles className="w-3 h-3 mr-1" />IA</Badge>
                    <span className="ml-auto">
                      {expandedSections.thematic ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </CardTitle>
                </CardHeader>
                {expandedSections.thematic && (
                  <CardContent className="pt-4 space-y-6">
                    {/* Mensaje Universal */}
                    {thematicAnalysis.mensaje_universal && (
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-center">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Mensaje Universal</p>
                        <p className="text-sm font-medium italic">"{thematicAnalysis.mensaje_universal}"</p>
                      </div>
                    )}

                    {/* Tema Principal */}
                    {thematicAnalysis.tema_principal && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Tema Principal</h4>
                        <div className="border-l-4 border-purple-500 pl-4 space-y-1">
                          <p className="font-medium">{thematicAnalysis.tema_principal.nombre}</p>
                          <p className="text-sm text-muted-foreground">{thematicAnalysis.tema_principal.descripcion}</p>
                          <p className="text-xs text-muted-foreground"><strong>Desarrollo:</strong> {thematicAnalysis.tema_principal.como_se_desarrolla}</p>
                          {thematicAnalysis.tema_principal.escenas_clave?.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {thematicAnalysis.tema_principal.escenas_clave.map((e, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Temas Secundarios */}
                    {thematicAnalysis.temas_secundarios?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Temas Secundarios</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {thematicAnalysis.temas_secundarios.map((t, i) => (
                            <div key={i} className="border rounded-lg p-3 space-y-1">
                              <p className="font-medium text-sm">{t.nombre}</p>
                              <p className="text-xs text-muted-foreground">{t.descripcion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simbolismos */}
                    {thematicAnalysis.simbolismos?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Simbolismos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {thematicAnalysis.simbolismos.map((s, i) => (
                            <div key={i} className="border rounded-lg p-3">
                              <p className="font-medium text-sm">{s.elemento}</p>
                              <p className="text-xs text-muted-foreground">{s.significado}</p>
                              {s.apariciones?.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {s.apariciones.map((a, j) => (
                                    <Badge key={j} variant="outline" className="text-xs">{a}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </CreativeLayout>
  );
}
