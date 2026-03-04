-- =============================================================================
-- Migracion: Agregar columnas de tipo unidad, fases y tipo contrato
-- Soporte para Jornadas/Semanas/Tanto Alzado y fases PRE/ROD/POST
-- =============================================================================

ALTER TABLE budget_lines
  ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'SEM',
  ADD COLUMN IF NOT EXISTS pre_weeks numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rod_weeks numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_weeks numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'indefinido';

-- Comentarios descriptivos
COMMENT ON COLUMN budget_lines.unit_type IS 'Tipo de unidad: TA (Tanto Alzado), SEM (Semanas), JORNADAS';
COMMENT ON COLUMN budget_lines.pre_weeks IS 'Semanas/jornadas en pre-produccion';
COMMENT ON COLUMN budget_lines.rod_weeks IS 'Semanas/jornadas en rodaje';
COMMENT ON COLUMN budget_lines.post_weeks IS 'Semanas/jornadas en post-produccion';
COMMENT ON COLUMN budget_lines.contract_type IS 'Tipo de contrato: indefinido, temporal, autonomo';
