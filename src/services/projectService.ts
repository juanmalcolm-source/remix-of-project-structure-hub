import { supabase } from '@/integrations/supabase/client';
import type { AnalisisGuion } from '@/types/analisisGuion';

/**
 * Creates a new project from script analysis results (v2.0 - Deep Narrative Analysis)
 */
export async function createProjectFromAnalysis(
  userId: string,
  scriptText: string,
  analisis: AnalisisGuion
): Promise<string> {
  console.log('=== Creando proyecto desde análisis v2.0 ===');
  console.log('Logline:', analisis.informacion_general.logline);
  console.log('Synopsis:', analisis.informacion_general.synopsis);
  console.log('Personajes:', analisis.personajes?.length);
  console.log('Localizaciones:', analisis.localizaciones?.length);
  console.log('Secuencias:', analisis.desglose_secuencias?.length);
  console.log('Errores narrativos:', analisis.analisis_narrativo?.errores_narrativos?.length || 0);
  console.log('DAFO:', analisis.analisis_dafo ? 'Sí' : 'No');
  console.log('Relaciones:', analisis.relaciones_personajes?.length || 0);
  console.log('Audiencias sugeridas:', analisis.perfiles_audiencia_sugeridos?.length || 0);

  // Detect project type automatically based on script pages
  const paginasTotales = analisis.informacion_general.paginas_totales ||
    Math.ceil(scriptText.length / 600);
  const projectType = paginasTotales < 60 ? 'cortometraje' : 'largometraje';

  console.log('Páginas detectadas:', paginasTotales, '-> Tipo:', projectType);

  // ═══════════════════════════════════════════════════════════
  // 1. CREATE PROJECT with enriched metadata
  // ═══════════════════════════════════════════════════════════
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: analisis.informacion_general.titulo || 'Sin título',
      logline: analisis.informacion_general.logline || null,
      script_text: scriptText,
      project_type: projectType,
      status: 'completed',
      genero: analisis.informacion_general.genero || null,
      subgeneros: analisis.informacion_general.subgeneros || null,
      tono: analisis.informacion_general.tono || null,
      estilo_visual_sugerido: analisis.informacion_general.estilo_visual_sugerido || null,
      publico_objetivo_sugerido: analisis.informacion_general.publico_objetivo_sugerido || null,
      referentes_cinematograficos: analisis.informacion_general.referentes_cinematograficos || null,
    } as never)
    .select()
    .single();

  if (projectError) {
    console.error('Error creando proyecto:', projectError);
    throw projectError;
  }
  if (!project) throw new Error('No se pudo crear el proyecto');

  const projectId = project.id;
  console.log('Proyecto creado con ID:', projectId);

  // ═══════════════════════════════════════════════════════════
  // 2. CREATE CREATIVE ANALYSIS with ALL new fields
  // ═══════════════════════════════════════════════════════════
  const analysisData: Record<string, unknown> = {
    project_id: projectId,
    // Campos existentes
    synopsis: analisis.informacion_general.synopsis || null,
    core_emotional: analisis.informacion_general.core_emotional || null,
    central_theme: analisis.informacion_general.central_theme || null,
    act_structure: analisis.analisis_narrativo?.estructura_actos || null,
    turning_points: analisis.analisis_narrativo?.puntos_de_giro || null,
    emotional_curve: analisis.analisis_narrativo?.curva_emocional || null,
    strengths: analisis.viabilidad?.fortalezas || [
      `Duración estimada: ${analisis.informacion_general.duracion_estimada_minutos} minutos`,
      `Días de rodaje: ${analisis.resumen_produccion.dias_rodaje.estimacion_recomendada}`,
    ],
    weaknesses: analisis.viabilidad?.debilidades || [],
    improvement_suggestions: analisis.viabilidad?.sugerencias_mejora || [],
    viability_factors_positive: analisis.viabilidad?.factores_positivos || [],
    viability_factors_negative: analisis.viabilidad?.factores_negativos || [],
    producibility_score: calculateProducibilityScore(analisis),
    estimated_budget_range: getEstimatedBudget(analisis),
    // ═══ NUEVOS CAMPOS v2.0 ═══
    narrative_errors: analisis.analisis_narrativo?.errores_narrativos || null,
    conflicts_analysis: analisis.analisis_narrativo?.conflictos || null,
    pacing_analysis: analisis.analisis_narrativo?.ritmo || null,
    thematic_analysis: analisis.analisis_narrativo?.tematica || null,
    dafo_analysis: analisis.analisis_dafo || null,
    character_relationships: analisis.relaciones_personajes || null,
    suggested_audience_profiles: analisis.perfiles_audiencia_sugeridos || null,
    market_potential: analisis.potencial_mercado || null,
    score_narrativo: analisis.analisis_dafo?.score_narrativo || null,
    score_comercial: analisis.analisis_dafo?.score_comercial || null,
    score_festival: analisis.analisis_dafo?.score_festival || null,
    referentes_cinematograficos: analisis.informacion_general.referentes_cinematograficos || null,
    subgeneros: analisis.informacion_general.subgeneros || null,
    potencial_festival: analisis.informacion_general.potencial_festival || null,
    potencial_comercial: analisis.informacion_general.potencial_comercial || null,
    analysis_version: '2.0',
  };

  const { error: analysisError } = await supabase
    .from('creative_analysis')
    .insert(analysisData as never);

  if (analysisError) {
    console.error('Error creating analysis:', analysisError);
    // Si falla por columnas nuevas que no existen aún, intentar sin ellas
    console.log('Intentando insertar sin campos nuevos (fallback)...');
    const fallbackData: Record<string, unknown> = {
      project_id: projectId,
      synopsis: analisis.informacion_general.synopsis || null,
      core_emotional: analisis.informacion_general.core_emotional || null,
      central_theme: analisis.informacion_general.central_theme || null,
      act_structure: analisis.analisis_narrativo?.estructura_actos || null,
      turning_points: analisis.analisis_narrativo?.puntos_de_giro || null,
      emotional_curve: analisis.analisis_narrativo?.curva_emocional || null,
      strengths: analisis.viabilidad?.fortalezas || [],
      weaknesses: analisis.viabilidad?.debilidades || [],
      improvement_suggestions: analisis.viabilidad?.sugerencias_mejora || [],
      viability_factors_positive: analisis.viabilidad?.factores_positivos || [],
      viability_factors_negative: analisis.viabilidad?.factores_negativos || [],
      producibility_score: calculateProducibilityScore(analisis),
      estimated_budget_range: getEstimatedBudget(analisis),
    };
    const { error: fallbackError } = await supabase
      .from('creative_analysis')
      .insert(fallbackData as never);
    if (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    } else {
      console.log('Creative analysis creado (modo fallback sin campos nuevos)');
    }
  } else {
    console.log('Creative analysis v2.0 creado correctamente');
  }

  // ═══════════════════════════════════════════════════════════
  // 3. CREATE CHARACTERS with deep analysis fields
  // ═══════════════════════════════════════════════════════════
  if (analisis.personajes && analisis.personajes.length > 0) {
    const charactersData = analisis.personajes.map((p) => ({
      project_id: projectId,
      name: p.nombre,
      category: p.categoria.toLowerCase(),
      description: p.descripcion || '',
      shooting_days: p.dias_rodaje_estimados || 0,
      dramatic_arc: p.arco_dramatico || null,
      relationships: p.relaciones_clave || [],
      // Nuevos campos v2.0
      motivaciones: p.motivaciones || null,
      conflictos: p.conflictos || null,
      necesidad_dramatica: p.necesidad_dramatica || null,
      flaw_principal: p.flaw_principal || null,
      transformacion: p.transformacion || null,
      ghost: p.ghost || null,
      stakes: p.stakes || null,
      funcion_narrativa: p.funcion_narrativa || null,
      genero: p.genero || null,
      edad_aproximada: p.edad_aproximada || null,
      importancia_trama: p.importancia_trama || null,
      escenas_aparicion: p.escenas_aparicion || null,
    } as never));

    console.log('Insertando personajes:', charactersData.length);
    const { error: charactersError } = await supabase.from('characters').insert(charactersData);
    if (charactersError) {
      console.error('Error creating characters (intentando fallback):', charactersError);
      // Fallback sin campos nuevos
      const fallbackChars = analisis.personajes.map((p) => ({
        project_id: projectId,
        name: p.nombre,
        category: p.categoria.toLowerCase(),
        description: p.descripcion || '',
        shooting_days: p.dias_rodaje_estimados || 0,
        dramatic_arc: p.arco_dramatico || null,
        relationships: p.relaciones_clave || [],
      }));
      const { error: fallbackErr } = await supabase.from('characters').insert(fallbackChars);
      if (fallbackErr) console.error('Error en fallback characters:', fallbackErr);
      else console.log('Personajes creados (modo fallback)');
    } else {
      console.log('Personajes v2.0 creados correctamente');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. CREATE LOCATIONS
  // ═══════════════════════════════════════════════════════════
  if (analisis.localizaciones && analisis.localizaciones.length > 0) {
    const locationsData = analisis.localizaciones.map((loc) => ({
      project_id: projectId,
      name: loc.nombre,
      location_type: loc.tipo === 'INT' ? 'interior' : loc.tipo === 'EXT' ? 'exterior' : 'mixto',
      complexity: (loc.complejidad || 'media').toLowerCase(),
      estimated_days: Math.ceil(loc.dias_rodaje_estimados || 1),
      special_needs: loc.necesidades_especiales?.join(', ') || '',
      production_notes: loc.descripcion || '',
    }));

    console.log('Insertando localizaciones:', locationsData.length);
    const { error: locationsError } = await supabase.from('locations').insert(locationsData);
    if (locationsError) {
      console.error('Error creating locations:', locationsError);
    } else {
      console.log('Localizaciones creadas correctamente');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 5. CREATE SEQUENCES
  // ═══════════════════════════════════════════════════════════
  if (analisis.desglose_secuencias && analisis.desglose_secuencias.length > 0) {
    const sequencesData = analisis.desglose_secuencias.map((seq, index) => ({
      project_id: projectId,
      sequence_number: seq.numero_secuencia || index + 1,
      title: seq.encabezado || `Secuencia ${index + 1}`,
      description: seq.localizacion || '',
      estimated_duration_minutes: Math.ceil(seq.duracion_estimada_minutos || seq.paginas_octavos || 1),
      characters_in_scene: seq.personajes || [],
      wardrobe: seq.vestuario || [],
      attrezzo: seq.attrezzo || [],
      effects: seq.efectos_especiales || [],
    }));

    console.log('Insertando secuencias:', sequencesData.length);
    const { error: sequencesError } = await supabase.from('sequences').insert(sequencesData);
    if (sequencesError) {
      console.error('Error creating sequences:', sequencesError);
    } else {
      console.log('Secuencias creadas correctamente');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 6. CREATE INITIAL FINANCING PLAN
  // ═══════════════════════════════════════════════════════════
  const { error: financingError } = await supabase
    .from('financing_plan')
    .insert({ project_id: projectId, total_budget: 500000 });

  if (financingError) {
    console.error('Error creating financing plan:', financingError);
  }

  // ═══════════════════════════════════════════════════════════
  // 7. CREATE AUDIENCE PROFILES from AI analysis (NEW)
  // ═══════════════════════════════════════════════════════════
  if (analisis.perfiles_audiencia_sugeridos && analisis.perfiles_audiencia_sugeridos.length > 0) {
    const audiencesData = analisis.perfiles_audiencia_sugeridos.map((perfil) => ({
      project_id: projectId,
      nombre: perfil.segmento,
      rango_edad: perfil.rango_edad || null,
      intereses: perfil.intereses || [],
      descripcion: perfil.motivacion_ver || null,
      prioridad: 'alta',
    }));

    console.log('Insertando perfiles de audiencia:', audiencesData.length);
    const { error: audiencesError } = await supabase.from('audiences').insert(audiencesData);
    if (audiencesError) {
      console.error('Error creating audiences:', audiencesError);
    } else {
      console.log('Perfiles de audiencia creados correctamente');
    }
  }

  console.log('=== Proyecto v2.0 creado completamente:', projectId, '===');
  return projectId;
}

/**
 * Calculates producibility score based on analysis complexity
 */
function calculateProducibilityScore(analisis: AnalisisGuion): number {
  let score = 100;

  // Factor: número de localizaciones
  if (analisis.localizaciones.length > 20) score -= 20;
  else if (analisis.localizaciones.length > 10) score -= 10;

  // Factor: número de personajes
  if (analisis.personajes.length > 30) score -= 15;
  else if (analisis.personajes.length > 15) score -= 7;

  // Factor: complejidad general
  if (analisis.resumen_produccion?.complejidad_general === 'Alta') score -= 30;
  else if (analisis.resumen_produccion?.complejidad_general === 'Media') score -= 15;

  // Factor: escenas de alta complejidad
  const escenasAltas = analisis.desglose_secuencias?.filter(
    s => s.complejidad_rodaje === 'Alta'
  ).length || 0;
  if (escenasAltas > 10) score -= 10;
  else if (escenasAltas > 5) score -= 5;

  // Factor: exteriores nocturnos (muy costosos)
  const nocturnasExt = analisis.localizaciones?.filter(
    l => l.tipo === 'EXT' && l.momento_dia === 'NOCHE'
  ).length || 0;
  if (nocturnasExt > 3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Estimates budget range based on analysis
 */
function getEstimatedBudget(analisis: AnalisisGuion): string {
  const paginasTotales = analisis.informacion_general.paginas_totales || 0;
  const isCorto = paginasTotales < 60;

  if (isCorto) {
    const score = calculateProducibilityScore(analisis);
    if (score >= 80) return '€10K - €50K';
    if (score >= 60) return '€50K - €150K';
    if (score >= 40) return '€150K - €300K';
    return '€300K+';
  }

  const score = calculateProducibilityScore(analisis);
  if (score >= 80) return '€200K - €500K';
  if (score >= 60) return '€500K - €1M';
  if (score >= 40) return '€1M - €2.5M';
  return '€2.5M+';
}
