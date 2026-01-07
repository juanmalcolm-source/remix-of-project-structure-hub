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
  // 1. Create the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title: analisis.informacion_general.titulo || 'Sin título',
      script_text: scriptText,
      project_type: 'largometraje',
      status: 'completed',
    })
    .select()
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error('No se pudo crear el proyecto');

  const projectId = project.id;

  // 2. Create creative analysis
  const { error: analysisError } = await supabase
    .from('creative_analysis')
    .insert({
      project_id: projectId,
      producibility_score: calculateProducibilityScore(analisis),
      estimated_budget_range: getEstimatedBudget(analisis),
      strengths: [
        `Duración estimada: ${analisis.informacion_general.duracion_estimada_minutos} minutos`,
        `Días de rodaje: ${analisis.resumen_produccion.dias_rodaje.estimacion_recomendada}`,
      ],
      weaknesses: [],
    });

  if (analysisError) console.error('Error creating analysis:', analysisError);

  // 3. Create characters
  if (analisis.personajes.length > 0) {
    const charactersData = analisis.personajes.map((p) => ({
      project_id: projectId,
      name: p.nombre,
      category: p.categoria.toLowerCase(),
      description: p.descripcion || '',
      shooting_days: p.dias_rodaje_estimados || 0,
    }));

    const { error: charactersError } = await supabase.from('characters').insert(charactersData);
    if (charactersError) console.error('Error creating characters:', charactersError);
  }

  // 4. Create locations
  if (analisis.localizaciones.length > 0) {
    const locationsData = analisis.localizaciones.map((loc) => ({
      project_id: projectId,
      name: loc.nombre,
      location_type: loc.tipo,
      complexity: loc.complejidad || 'Media',
      estimated_days: loc.dias_rodaje_estimados || 1,
      special_needs: loc.necesidades_especiales?.join(', ') || '',
    }));

    const { error: locationsError } = await supabase.from('locations').insert(locationsData);
    if (locationsError) console.error('Error creating locations:', locationsError);
  }

  // 5. Create sequences
  if (analisis.desglose_secuencias.length > 0) {
    const sequencesData = analisis.desglose_secuencias.map((seq, index) => ({
      project_id: projectId,
      sequence_number: seq.numero_secuencia || index + 1,
      title: seq.encabezado || `Secuencia ${index + 1}`,
      description: seq.localizacion || '',
      characters_in_scene: seq.personajes || [],
      wardrobe: seq.vestuario || [],
      attrezzo: seq.attrezzo || [],
      effects: seq.efectos_especiales || [],
    }));

    const { error: sequencesError } = await supabase.from('sequences').insert(sequencesData);
    if (sequencesError) console.error('Error creating sequences:', sequencesError);
  }

  // 6. Create initial financing plan
  const { error: financingError } = await supabase
    .from('financing_plan')
    .insert({ project_id: projectId, total_budget: 500000 });

  if (financingError) console.error('Error creating financing plan:', financingError);

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
