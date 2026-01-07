import { supabase } from '@/integrations/supabase/client';
import type { AnalisisGuion } from '@/types/analisisGuion';

/**
 * Creates a new project from script analysis results
 */
export async function createProjectFromAnalysis(
  userId: string,
  scriptText: string,
  analisis: AnalisisGuion
): Promise<string> {
  console.log('Creando proyecto desde análisis...');
  console.log('Logline:', analisis.informacion_general.logline);
  console.log('Synopsis:', analisis.informacion_general.synopsis);
  console.log('Core Emotional:', analisis.informacion_general.core_emotional);
  console.log('Central Theme:', analisis.informacion_general.central_theme);
  console.log('Personajes:', analisis.personajes?.length);
  console.log('Localizaciones:', analisis.localizaciones?.length);
  console.log('Secuencias:', analisis.desglose_secuencias?.length);

  // 1. Create the project with logline
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: analisis.informacion_general.titulo || 'Sin título',
      logline: analisis.informacion_general.logline || null,
      script_text: scriptText,
      project_type: 'largometraje',
      status: 'completed',
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creando proyecto:', projectError);
    throw projectError;
  }
  if (!project) throw new Error('No se pudo crear el proyecto');

  const projectId = project.id;
  console.log('Proyecto creado con ID:', projectId);

  // 2. Create creative analysis with ALL fields
  const analysisData: Record<string, unknown> = {
    project_id: projectId,
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
  };

  const { error: analysisError } = await supabase
    .from('creative_analysis')
    .insert(analysisData as never);

  if (analysisError) {
    console.error('Error creating analysis:', analysisError);
  } else {
    console.log('Creative analysis creado correctamente');
  }

  // 3. Create characters with dramatic arc and relationships
  if (analisis.personajes && analisis.personajes.length > 0) {
    const charactersData = analisis.personajes.map((p) => ({
      project_id: projectId,
      name: p.nombre,
      category: p.categoria.toLowerCase(),
      description: p.descripcion || '',
      shooting_days: p.dias_rodaje_estimados || 0,
      dramatic_arc: p.arco_dramatico || null,
      relationships: p.relaciones_clave || [],
    }));

    console.log('Insertando personajes:', charactersData.length);
    const { error: charactersError } = await supabase.from('characters').insert(charactersData);
    if (charactersError) {
      console.error('Error creating characters:', charactersError);
    } else {
      console.log('Personajes creados correctamente');
    }
  }

  // 4. Create locations
  if (analisis.localizaciones && analisis.localizaciones.length > 0) {
    const locationsData = analisis.localizaciones.map((loc) => ({
      project_id: projectId,
      name: loc.nombre,
      location_type: loc.tipo,
      complexity: loc.complejidad || 'Media',
      estimated_days: loc.dias_rodaje_estimados || 1,
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

  // 5. Create sequences with estimated duration
  if (analisis.desglose_secuencias && analisis.desglose_secuencias.length > 0) {
    const sequencesData = analisis.desglose_secuencias.map((seq, index) => ({
      project_id: projectId,
      sequence_number: seq.numero_secuencia || index + 1,
      title: seq.encabezado || `Secuencia ${index + 1}`,
      description: seq.localizacion || '',
      // Calculate duration: 1 minute per page (paginas_octavos is in eighths)
      estimated_duration_minutes: seq.duracion_estimada_minutos || Math.ceil(seq.paginas_octavos || 1),
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

  // 6. Create initial financing plan
  const { error: financingError } = await supabase
    .from('financing_plan')
    .insert({ project_id: projectId, total_budget: 500000 });

  if (financingError) {
    console.error('Error creating financing plan:', financingError);
  }

  console.log('Proyecto creado completamente:', projectId);
  return projectId;
}

function calculateProducibilityScore(analisis: AnalisisGuion): number {
  let score = 100;
  if (analisis.localizaciones.length > 20) score -= 20;
  else if (analisis.localizaciones.length > 10) score -= 10;
  if (analisis.personajes.length > 30) score -= 15;
  else if (analisis.personajes.length > 15) score -= 7;
  if (analisis.resumen_produccion?.complejidad_general === 'Alta') score -= 30;
  else if (analisis.resumen_produccion?.complejidad_general === 'Media') score -= 15;
  return Math.max(0, Math.min(100, score));
}

function getEstimatedBudget(analisis: AnalisisGuion): string {
  const score = calculateProducibilityScore(analisis);
  if (score >= 80) return '€50K - €200K';
  if (score >= 60) return '€200K - €500K';
  if (score >= 40) return '€500K - €1M';
  return '€1M+';
}
