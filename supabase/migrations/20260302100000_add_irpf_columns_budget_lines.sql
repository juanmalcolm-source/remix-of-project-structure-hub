-- Add IRPF (income tax withholding) columns to budget_lines
-- for personnel chapters (02 Personal Artístico, 03 Equipo Técnico)
ALTER TABLE public.budget_lines
ADD COLUMN IF NOT EXISTS irpf_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS irpf_cost numeric DEFAULT 0;
