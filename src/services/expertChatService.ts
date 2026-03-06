/**
 * Expert Chat Service
 * Client-side service for AI expert assistants per section.
 * Handles streaming chat, diagnostic mode, and context building from Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import { readSSEStream } from './budgetEstimator';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type ExpertType = 'creativa' | 'produccion' | 'financiacion' | 'audiencias' | 'convocatorias';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DiagnosticAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action: string;
}

export interface DiagnosticResult {
  alerts: DiagnosticAlert[];
  score: number;
  summary: string;
}

export interface ExpertConfig {
  name: string;
  role: string;
  emoji: string;
  color: string;
  colorBg: string;
  greeting: string;
  suggestions: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// EXPERT CONFIGS
// ═══════════════════════════════════════════════════════════════════════

export const EXPERT_CONFIGS: Record<ExpertType, ExpertConfig> = {
  creativa: {
    name: 'Ana',
    role: 'Script Doctor',
    emoji: '🎬',
    color: 'text-violet-600',
    colorBg: 'bg-violet-100 dark:bg-violet-900/30',
    greeting: 'Hola, soy Ana, tu asesora creativa. Conozco tu proyecto y estoy lista para ayudarte con el desarrollo del guion, los personajes, la estructura narrativa o el posicionamiento en festivales. ¿En que puedo ayudarte?',
    suggestions: [
      '¿Que problemas narrativos detectas?',
      '¿Como mejorar el arco del protagonista?',
      '¿Festivales para este proyecto?',
    ],
  },
  produccion: {
    name: 'Carlos',
    role: '1er Ayudante de Direccion',
    emoji: '🎥',
    color: 'text-orange-600',
    colorBg: 'bg-orange-100 dark:bg-orange-900/30',
    greeting: 'Que tal, soy Carlos. Tengo el desglose de tu proyecto delante. Puedo ayudarte con el plan de rodaje, presupuesto ICAA, logistica de localizaciones o cualquier tema de produccion. Dispara.',
    suggestions: [
      '¿Cumple los limites ICAA?',
      '¿Cuantos dias de rodaje necesito?',
      '¿Problemas en el plan de rodaje?',
    ],
  },
  financiacion: {
    name: 'Isabel',
    role: 'Productora Ejecutiva',
    emoji: '💰',
    color: 'text-emerald-600',
    colorBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    greeting: 'Buenos dias. Soy Isabel, su asesora de financiacion. Tengo acceso a su plan financiero y puedo evaluar la viabilidad de las fuentes, detectar incompatibilidades entre ayudas o sugerirle estrategias de financiacion. ¿En que le puedo ayudar?',
    suggestions: [
      '¿Que estructura financiera recomiendas?',
      '¿Es viable el plan?',
      '¿Que ayudas puedo solicitar?',
    ],
  },
  audiencias: {
    name: 'Pablo',
    role: 'Estratega de Audiencias',
    emoji: '📊',
    color: 'text-blue-600',
    colorBg: 'bg-blue-100 dark:bg-blue-900/30',
    greeting: 'Hola, soy Pablo, tu estratega de audiencias y distribucion. Puedo ayudarte a definir tu publico objetivo, disenar buyer personas, planificar la estrategia de festivales o el plan de distribucion. ¿Que necesitas?',
    suggestions: [
      '¿Quien es mi publico objetivo?',
      '¿Estrategia de festivales?',
      '¿Como posicionar la pelicula?',
    ],
  },
  convocatorias: {
    name: 'Elena',
    role: 'Experta en Ayudas Publicas',
    emoji: '📋',
    color: 'text-amber-600',
    colorBg: 'bg-amber-100 dark:bg-amber-900/30',
    greeting: 'Buenos dias. Soy Elena, su experta en convocatorias y ayudas publicas. Puedo revisar el estado de sus solicitudes, detectar convocatorias relevantes o alertarle sobre plazos proximos. ¿En que puedo asistirle?',
    suggestions: [
      '¿Convocatorias abiertas ahora?',
      '¿Documentacion que falta?',
      '¿Proxima fecha limite?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// CONTEXT BUILDERS
// ═══════════════════════════════════════════════════════════════════════

const MAX_CONTEXT_CHARS = 8000;

function truncateContext(text: string): string {
  if (text.length <= MAX_CONTEXT_CHARS) return text;
  return text.slice(0, MAX_CONTEXT_CHARS) + '\n... [contexto truncado por longitud]';
}

async function formatCreativaContext(projectId: string): Promise<string> {
  const [
    { data: project },
    { data: analysis },
    { data: characters },
    { data: sequences },
    { data: locations },
  ] = await Promise.all([
    supabase.from('projects').select('title, genero, logline, project_type, tono, subgeneros, referentes_cinematograficos, estilo_visual_sugerido, publico_objetivo_sugerido').eq('id', projectId).single(),
    supabase.from('creative_analysis').select('*').eq('project_id', projectId).single(),
    supabase.from('characters').select('name, category, character_arc, motivation, edad_aproximada').eq('project_id', projectId),
    supabase.from('sequences').select('sequence_number, title, description, time_of_day, page_eighths, scene_complexity').eq('project_id', projectId).order('sequence_number'),
    supabase.from('locations').select('name, zone, production_notes').eq('project_id', projectId),
  ]);

  let ctx = '';

  if (project) {
    ctx += `PROYECTO: ${project.title || 'Sin titulo'}\n`;
    ctx += `Genero: ${project.genero || 'No definido'} | Tipo: ${project.project_type || 'No definido'}\n`;
    if (project.logline) ctx += `Logline: ${project.logline}\n`;
    if (project.tono) ctx += `Tono: ${project.tono}\n`;
    if (project.subgeneros) ctx += `Subgéneros: ${Array.isArray(project.subgeneros) ? (project.subgeneros as string[]).join(', ') : project.subgeneros}\n`;
    if (project.referentes_cinematograficos) ctx += `Referentes: ${Array.isArray(project.referentes_cinematograficos) ? (project.referentes_cinematograficos as string[]).join(', ') : project.referentes_cinematograficos}\n`;
    if (project.estilo_visual_sugerido) ctx += `Estilo visual: ${project.estilo_visual_sugerido}\n`;
    if (project.publico_objetivo_sugerido) ctx += `Público objetivo: ${project.publico_objetivo_sugerido}\n`;
  }

  if (analysis) {
    ctx += `\nANALISIS CREATIVO:\n`;
    const a = analysis as Record<string, unknown>;
    if (a.synopsis) ctx += `Sinopsis: ${String(a.synopsis).slice(0, 500)}\n`;
    if (a.core_emotional) ctx += `Core emocional: ${a.core_emotional}\n`;
    if (a.central_theme) ctx += `Tema central: ${a.central_theme}\n`;
    if (a.strengths) ctx += `Fortalezas: ${JSON.stringify(a.strengths)}\n`;
    if (a.weaknesses) ctx += `Debilidades: ${JSON.stringify(a.weaknesses)}\n`;
    if (a.narrative_errors) ctx += `Errores narrativos: ${JSON.stringify(a.narrative_errors)}\n`;
    if (a.thematic_analysis) ctx += `Temática: ${JSON.stringify(a.thematic_analysis)}\n`;
    if (a.dafo_analysis) ctx += `Análisis DAFO: ${JSON.stringify(a.dafo_analysis)}\n`;
    if (a.viability_factors_positive) ctx += `Factores positivos: ${JSON.stringify(a.viability_factors_positive)}\n`;
    if (a.viability_factors_negative) ctx += `Factores negativos: ${JSON.stringify(a.viability_factors_negative)}\n`;
    if (a.producibility_score) ctx += `Puntuacion producibilidad: ${a.producibility_score}/100\n`;
    if (a.score_narrativo) ctx += `Score narrativo: ${a.score_narrativo}/100\n`;
    if (a.score_comercial) ctx += `Score comercial: ${a.score_comercial}/100\n`;
    if (a.score_festival) ctx += `Score festival: ${a.score_festival}/100\n`;
  }

  if (characters && characters.length > 0) {
    ctx += `\nPERSONAJES (${characters.length}):\n`;
    for (const c of characters.slice(0, 15)) {
      ctx += `- ${c.name} (${c.category || 'sin categoria'})`;
      if (c.character_arc) ctx += ` — Arco: ${String(c.character_arc).slice(0, 80)}`;
      ctx += '\n';
    }
  }

  if (sequences && sequences.length > 0) {
    ctx += `\nSECUENCIAS (${sequences.length} escenas):\n`;
    for (const s of sequences.slice(0, 30)) {
      ctx += `${s.sequence_number}. ${s.title} [${s.time_of_day || '?'}] ${s.page_eighths || 0}/8 pag — ${s.scene_complexity || 'media'}\n`;
    }
    if (sequences.length > 30) ctx += `... y ${sequences.length - 30} escenas mas\n`;
  }

  if (locations && locations.length > 0) {
    ctx += `\nLOCALIZACIONES (${locations.length}):\n`;
    for (const l of locations) {
      ctx += `- ${l.name}${l.zone ? ` (${l.zone})` : ''}\n`;
    }
  }

  return truncateContext(ctx);
}

async function formatProduccionContext(projectId: string): Promise<string> {
  const [
    { data: project },
    { data: sequences },
    { data: locations },
    { data: shootingDays },
    { data: budgetLines },
    { data: characters },
  ] = await Promise.all([
    supabase.from('projects').select('title, genero, project_type').eq('id', projectId).single(),
    supabase.from('sequences').select('sequence_number, title, time_of_day, page_eighths, scene_complexity, characters_in_scene, int_ext, complejidad_factores').eq('project_id', projectId).order('sequence_number'),
    supabase.from('locations').select('name, zone, address, production_notes, special_needs').eq('project_id', projectId),
    supabase.from('shooting_days').select('day_number, location, time_of_day, total_eighths, estimated_hours, scenes_count, characters').eq('project_id', projectId).order('day_number'),
    supabase.from('budget_lines').select('chapter, account_number, concept, units, quantity, unit_price').eq('project_id', projectId).order('chapter').order('account_number'),
    supabase.from('characters').select('name, category, edad_aproximada').eq('project_id', projectId),
  ]);

  let ctx = '';

  if (project) {
    ctx += `PROYECTO: ${project.title || 'Sin titulo'} | ${project.genero || ''} | ${project.project_type || ''}\n`;
  }

  if (sequences && sequences.length > 0) {
    const totalEighths = sequences.reduce((s, sq) => s + (sq.page_eighths || 0), 0);
    ctx += `\nSECUENCIAS: ${sequences.length} escenas, ${totalEighths} octavos totales\n`;
    const nightCount = sequences.filter(s => (s.time_of_day || '').toLowerCase().includes('noche')).length;
    const extCount = sequences.filter(s => (s.int_ext || '').includes('EXT')).length;
    ctx += `Noches: ${nightCount} | Exteriores: ${extCount}\n`;
    for (const s of sequences.slice(0, 25)) {
      const chars = Array.isArray(s.characters_in_scene) ? (s.characters_in_scene as string[]).join(', ') : '';
      ctx += `${s.sequence_number}. ${s.title} [${s.time_of_day || '?'}] ${s.page_eighths}/8 ${s.scene_complexity || ''} ${chars ? `— ${chars}` : ''}\n`;
    }
    if (sequences.length > 25) ctx += `... y ${sequences.length - 25} escenas mas\n`;
  }

  if (locations && locations.length > 0) {
    ctx += `\nLOCALIZACIONES (${locations.length}):\n`;
    for (const l of locations) {
      ctx += `- ${l.name}${l.zone ? ` (${l.zone})` : ''}`;
      if (l.production_notes) ctx += ` — Notas: ${l.production_notes}`;
      if (l.special_needs) ctx += ` | Necesidades: ${l.special_needs}`;
      ctx += '\n';
    }
  }

  if (characters && characters.length > 0) {
    const menores = characters.filter(c => {
      const edad = c.edad_aproximada;
      if (!edad) return false;
      const num = parseInt(String(edad));
      return !isNaN(num) && num < 18;
    });
    if (menores.length > 0) {
      ctx += `\nMENORES EN REPARTO: ${menores.map(m => `${m.name} (${m.edad_aproximada})`).join(', ')}\n`;
    }
  }

  if (shootingDays && shootingDays.length > 0) {
    ctx += `\nPLAN DE RODAJE: ${shootingDays.length} dias\n`;
    for (const d of shootingDays) {
      ctx += `Dia ${d.day_number}: ${d.location || '?'} [${d.time_of_day || '?'}] ${d.total_eighths || 0}/8, ${(d.estimated_hours || 0).toFixed(1)}h, ${d.scenes_count || 0} escenas\n`;
    }
  }

  if (budgetLines && budgetLines.length > 0) {
    ctx += `\nPRESUPUESTO: ${budgetLines.length} partidas\n`;
    const byChapter = new Map<number, number>();
    for (const bl of budgetLines) {
      const total = (bl.units || 1) * (bl.quantity || 1) * (bl.unit_price || 0);
      byChapter.set(bl.chapter, (byChapter.get(bl.chapter) || 0) + total);
    }
    let grandTotal = 0;
    for (const [chapter, total] of byChapter) {
      ctx += `Cap ${chapter}: ${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n`;
      grandTotal += total;
    }
    ctx += `TOTAL: ${grandTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n`;
  }

  return truncateContext(ctx);
}

async function formatFinanciacionContext(projectId: string): Promise<string> {
  const [
    { data: project },
    { data: financingPlan },
    { data: financingSources },
    { data: budgetLines },
  ] = await Promise.all([
    supabase.from('projects').select('title, genero, project_type').eq('id', projectId).single(),
    supabase.from('financing_plan').select('*').eq('project_id', projectId).single(),
    supabase.from('financing_sources').select('*').eq('project_id', projectId).order('amount', { ascending: false }),
    supabase.from('budget_lines').select('chapter, account_number, concept, units, quantity, unit_price').eq('project_id', projectId),
  ]);

  let ctx = '';

  if (project) {
    ctx += `PROYECTO: ${project.title || 'Sin titulo'} | ${project.genero || ''} | ${project.project_type || ''}\n`;
  }

  if (budgetLines && budgetLines.length > 0) {
    let total = 0;
    for (const bl of budgetLines) {
      total += (bl.units || 1) * (bl.quantity || 1) * (bl.unit_price || 0);
    }
    ctx += `PRESUPUESTO TOTAL: ${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n`;
  }

  if (financingPlan) {
    ctx += `\nPLAN DE FINANCIACION:\n`;
    const fp = financingPlan as Record<string, unknown>;
    for (const [key, value] of Object.entries(fp)) {
      if (key !== 'id' && key !== 'project_id' && key !== 'created_at' && key !== 'updated_at' && value != null) {
        ctx += `${key}: ${value}\n`;
      }
    }
  }

  if (financingSources && financingSources.length > 0) {
    ctx += `\nFUENTES DE FINANCIACION (${financingSources.length}):\n`;
    let totalSources = 0;
    for (const fs of financingSources) {
      const s = fs as Record<string, unknown>;
      const amount = Number(s.amount) || 0;
      totalSources += amount;
      ctx += `- ${s.name || s.source_type || 'Fuente'}: ${amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`;
      if (s.status) ctx += ` (${s.status})`;
      if (s.percentage) ctx += ` — ${s.percentage}%`;
      ctx += '\n';
    }
    ctx += `TOTAL FINANCIACION: ${totalSources.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}\n`;
  }

  return truncateContext(ctx);
}

async function formatAudienciasContext(projectId: string): Promise<string> {
  const [
    { data: project },
    { data: audiences },
    { data: buyerPersonas },
    { data: audienceDesigns },
  ] = await Promise.all([
    supabase.from('projects').select('title, genero, project_type, logline, referentes_cinematograficos').eq('id', projectId).single(),
    supabase.from('audiences').select('*').eq('project_id', projectId),
    supabase.from('buyer_personas').select('*').eq('project_id', projectId),
    supabase.from('audience_designs').select('*').eq('project_id', projectId),
  ]);

  let ctx = '';

  if (project) {
    ctx += `PROYECTO: ${project.title || 'Sin titulo'} | ${project.genero || ''} | ${project.project_type || ''}\n`;
    if (project.logline) ctx += `Logline: ${project.logline}\n`;
    if (project.referentes_cinematograficos) ctx += `Referentes: ${Array.isArray(project.referentes_cinematograficos) ? (project.referentes_cinematograficos as string[]).join(', ') : project.referentes_cinematograficos}\n`;
  }

  if (audiences && audiences.length > 0) {
    ctx += `\nSEGMENTOS DE AUDIENCIA (${audiences.length}):\n`;
    for (const a of audiences) {
      const aud = a as Record<string, unknown>;
      ctx += `- ${aud.name || aud.segment_name || 'Segmento'}`;
      if (aud.size_estimate) ctx += ` — Tamano: ${aud.size_estimate}`;
      if (aud.description) ctx += ` — ${String(aud.description).slice(0, 100)}`;
      ctx += '\n';
    }
  }

  if (buyerPersonas && buyerPersonas.length > 0) {
    ctx += `\nBUYER PERSONAS (${buyerPersonas.length}):\n`;
    for (const bp of buyerPersonas) {
      const p = bp as Record<string, unknown>;
      ctx += `- ${p.name || 'Persona'}`;
      if (p.age_range) ctx += ` (${p.age_range})`;
      if (p.description) ctx += `: ${String(p.description).slice(0, 120)}`;
      ctx += '\n';
    }
  }

  if (audienceDesigns && audienceDesigns.length > 0) {
    ctx += `\nDISENOS DE AUDIENCIA (${audienceDesigns.length}):\n`;
    for (const ad of audienceDesigns) {
      const d = ad as Record<string, unknown>;
      ctx += `- ${d.name || d.title || 'Diseno'}`;
      if (d.strategy) ctx += `: ${String(d.strategy).slice(0, 100)}`;
      ctx += '\n';
    }
  }

  return truncateContext(ctx);
}

async function formatConvocatoriasContext(projectId: string): Promise<string> {
  const [
    { data: project },
    { data: convocatorias },
    { data: solicitudes },
    { data: tareas },
  ] = await Promise.all([
    supabase.from('projects').select('title, genero, project_type').eq('id', projectId).single(),
    supabase.from('convocatorias').select('*').eq('project_id', projectId).order('fecha_cierre'),
    supabase.from('solicitudes').select('*').eq('project_id', projectId),
    supabase.from('tareas_solicitud').select('*').eq('project_id', projectId).order('fecha_limite'),
  ]);

  let ctx = '';

  if (project) {
    ctx += `PROYECTO: ${project.title || 'Sin titulo'} | ${project.genero || ''} | ${project.project_type || ''}\n`;
  }

  if (convocatorias && convocatorias.length > 0) {
    ctx += `\nCONVOCATORIAS (${convocatorias.length}):\n`;
    for (const c of convocatorias) {
      const conv = c as Record<string, unknown>;
      ctx += `- ${conv.nombre || conv.name || 'Convocatoria'}`;
      if (conv.organismo) ctx += ` (${conv.organismo})`;
      if (conv.fecha_cierre) ctx += ` — Cierre: ${conv.fecha_cierre}`;
      if (conv.estado || conv.status) ctx += ` [${conv.estado || conv.status}]`;
      if (conv.importe_maximo) ctx += ` — Max: ${Number(conv.importe_maximo).toLocaleString('es-ES')}€`;
      ctx += '\n';
    }
  }

  if (solicitudes && solicitudes.length > 0) {
    ctx += `\nSOLICITUDES (${solicitudes.length}):\n`;
    for (const s of solicitudes) {
      const sol = s as Record<string, unknown>;
      ctx += `- ${sol.nombre || sol.convocatoria_nombre || 'Solicitud'}`;
      if (sol.estado || sol.status) ctx += ` [${sol.estado || sol.status}]`;
      if (sol.fecha_presentacion) ctx += ` — Presentacion: ${sol.fecha_presentacion}`;
      ctx += '\n';
    }
  }

  if (tareas && tareas.length > 0) {
    ctx += `\nTAREAS PENDIENTES (${tareas.length}):\n`;
    const now = new Date();
    for (const t of tareas) {
      const tarea = t as Record<string, unknown>;
      const deadline = tarea.fecha_limite ? new Date(String(tarea.fecha_limite)) : null;
      const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
      ctx += `- ${tarea.titulo || tarea.nombre || 'Tarea'}`;
      if (tarea.estado || tarea.status) ctx += ` [${tarea.estado || tarea.status}]`;
      if (deadline) {
        ctx += ` — Limite: ${String(tarea.fecha_limite)}`;
        if (daysLeft !== null) {
          if (daysLeft < 0) ctx += ' ⚠️ VENCIDA';
          else if (daysLeft <= 7) ctx += ' ⚠️ URGENTE';
          else if (daysLeft <= 30) ctx += ' ⏰ PROXIMO';
        }
      }
      ctx += '\n';
    }
  }

  return truncateContext(ctx);
}

/**
 * Build project context for a specific expert type
 */
export async function buildExpertContext(projectId: string, expertType: ExpertType): Promise<string> {
  try {
    switch (expertType) {
      case 'creativa':
        return await formatCreativaContext(projectId);
      case 'produccion':
        return await formatProduccionContext(projectId);
      case 'financiacion':
        return await formatFinanciacionContext(projectId);
      case 'audiencias':
        return await formatAudienciasContext(projectId);
      case 'convocatorias':
        return await formatConvocatoriasContext(projectId);
      default:
        return 'No hay datos disponibles para este tipo de experto.';
    }
  } catch (err) {
    console.error(`[ExpertChat] Error building context for ${expertType}:`, err);
    return 'Error al cargar los datos del proyecto. El usuario debe verificar la conexion.';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// STREAMING CHAT
// ═══════════════════════════════════════════════════════════════════════

interface StreamExpertChatParams {
  expertType: ExpertType;
  messages: ChatMessage[];
  projectContext: string;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Stream chat response from expert, calling onDelta for each text chunk
 */
export async function streamExpertChat({
  expertType,
  messages,
  projectContext,
  onDelta,
  signal,
}: StreamExpertChatParams): Promise<string> {
  const response = await fetch('/api/expert-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expertType,
      mode: 'chat',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      projectContext,
    }),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = (errData as { error?: string }).error || errorMsg;
    } catch { /* keep default */ }
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No se pudo leer la respuesta del servidor');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          if (parsed.type === 'delta' && parsed.text) {
            fullText += parsed.text;
            onDelta(parsed.text);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error || 'Error en la generacion');
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Error en la generacion') {
            continue;
          }
          throw e;
        }
      }
    }
  }

  return fullText;
}

// ═══════════════════════════════════════════════════════════════════════
// DIAGNOSTIC
// ═══════════════════════════════════════════════════════════════════════

/**
 * Run diagnostic analysis for a specific expert
 */
export async function runDiagnostic(
  projectId: string,
  expertType: ExpertType
): Promise<DiagnosticResult> {
  const projectContext = await buildExpertContext(projectId, expertType);

  const response = await fetch('/api/expert-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expertType,
      mode: 'diagnostic',
      messages: [{ role: 'user', content: 'Analiza el estado actual del proyecto y genera un diagnostico.' }],
      projectContext,
    }),
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = (errData as { error?: string }).error || errorMsg;
    } catch { /* keep default */ }
    throw new Error(errorMsg);
  }

  // Diagnostic uses accumulate mode — readSSEStream handles 'complete' events
  const rawText = await readSSEStream(response);

  // Parse JSON from response
  try {
    const trimmed = rawText.trim();

    // Try direct parse
    try { return JSON.parse(trimmed); } catch { /* continue */ }

    // Try markdown fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
    }

    // Try outermost braces
    const braceStart = trimmed.indexOf('{');
    const braceEnd = trimmed.lastIndexOf('}');
    if (braceStart >= 0 && braceEnd > braceStart) {
      try { return JSON.parse(trimmed.slice(braceStart, braceEnd + 1)); } catch { /* continue */ }
    }

    throw new Error('Formato invalido');
  } catch {
    // Return a fallback diagnostic
    return {
      alerts: [{ severity: 'info', title: 'Diagnostico no disponible', description: 'No se pudo generar el diagnostico automatico. Abre el chat para consultar directamente.', action: 'Abrir chat' }],
      score: 50,
      summary: 'No se pudo completar el diagnostico automatico.',
    };
  }
}
