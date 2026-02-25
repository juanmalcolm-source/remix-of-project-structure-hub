-- ═══════════════════════════════════════════════════════════════
-- FASE 1: Análisis Narrativo Profundo - Nuevas columnas
-- ═══════════════════════════════════════════════════════════════

-- Nuevas columnas en creative_analysis para análisis profundo
ALTER TABLE creative_analysis
  ADD COLUMN IF NOT EXISTS narrative_errors jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conflicts_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pacing_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thematic_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dafo_analysis jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS character_relationships jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suggested_audience_profiles jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS market_potential jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_narrativo integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_comercial integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_festival integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referentes_cinematograficos jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subgeneros jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS potencial_festival text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS potencial_comercial text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS analysis_version text DEFAULT '1.0';

-- Nuevas columnas en characters para análisis profundo de personaje
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS motivaciones text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conflictos text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS necesidad_dramatica text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS flaw_principal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transformacion text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ghost text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stakes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS funcion_narrativa text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS genero text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS edad_aproximada text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS importancia_trama text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS escenas_aparicion jsonb DEFAULT NULL;

-- Nuevas columnas en projects para datos enriquecidos
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS genero text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subgeneros jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tono text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estilo_visual_sugerido text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS publico_objetivo_sugerido text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referentes_cinematograficos jsonb DEFAULT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN creative_analysis.narrative_errors IS 'Errores narrativos detectados: plot holes, inconsistencias, problemas de ritmo';
COMMENT ON COLUMN creative_analysis.conflicts_analysis IS 'Mapa completo de conflictos: principal, secundarios, internos, tensiones';
COMMENT ON COLUMN creative_analysis.pacing_analysis IS 'Análisis de ritmo: secciones lentas/rápidas, equilibrio diálogo/acción';
COMMENT ON COLUMN creative_analysis.thematic_analysis IS 'Análisis temático: temas, simbolismos, mensaje universal';
COMMENT ON COLUMN creative_analysis.dafo_analysis IS 'Análisis DAFO del guión: fortalezas, debilidades, oportunidades, amenazas';
COMMENT ON COLUMN creative_analysis.character_relationships IS 'Mapa de relaciones entre personajes';
COMMENT ON COLUMN creative_analysis.suggested_audience_profiles IS 'Perfiles de audiencia sugeridos por la IA';
COMMENT ON COLUMN creative_analysis.market_potential IS 'Potencial de mercado: territorios, festivales, plataformas';
COMMENT ON COLUMN creative_analysis.score_narrativo IS 'Score de calidad narrativa (0-100)';
COMMENT ON COLUMN creative_analysis.score_comercial IS 'Score de potencial comercial (0-100)';
COMMENT ON COLUMN creative_analysis.score_festival IS 'Score de potencial para festivales (0-100)';
