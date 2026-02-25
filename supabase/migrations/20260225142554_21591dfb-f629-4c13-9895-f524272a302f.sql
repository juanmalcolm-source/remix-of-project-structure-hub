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

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS genero text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subgeneros jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tono text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estilo_visual_sugerido text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS publico_objetivo_sugerido text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referentes_cinematograficos jsonb DEFAULT NULL;