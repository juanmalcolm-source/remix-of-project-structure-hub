-- Add new columns to budget_lines for full cost calculations
ALTER TABLE public.budget_lines
ADD COLUMN IF NOT EXISTS social_security_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_before_taxes numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_security_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS agency_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_percentage numeric DEFAULT 21,
ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tariff_source text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS budget_level text DEFAULT 'medio';

-- Create budget_history table for learning from similar projects
CREATE TABLE IF NOT EXISTS public.budget_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title text NOT NULL,
  project_type text, -- 'largometraje', 'cortometraje', 'serie', 'documental'
  duration_minutes integer,
  shooting_days integer,
  production_year integer,
  total_budget numeric,
  budget_json jsonb,
  actual_deviation_percent numeric, -- Real deviation after production
  complexity_score integer, -- 1-10
  has_vfx boolean DEFAULT false,
  has_action boolean DEFAULT false,
  has_children boolean DEFAULT false,
  has_animals boolean DEFAULT false,
  learning_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create budget_versions table for snapshot history
CREATE TABLE IF NOT EXISTS public.budget_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_name text,
  budget_json jsonb NOT NULL,
  total_amount numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_history
CREATE POLICY "Users can view their budget history" 
ON public.budget_history 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their budget history" 
ON public.budget_history 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their budget history" 
ON public.budget_history 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their budget history" 
ON public.budget_history 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS policies for budget_versions
CREATE POLICY "Users can view their project budget versions" 
ON public.budget_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = budget_versions.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert their project budget versions" 
ON public.budget_versions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = budget_versions.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete their project budget versions" 
ON public.budget_versions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = budget_versions.project_id 
  AND projects.user_id = auth.uid()
));

-- Add updated_at trigger for budget_history
CREATE TRIGGER update_budget_history_updated_at
  BEFORE UPDATE ON public.budget_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_budget_history_type_days 
ON public.budget_history(project_type, shooting_days);

CREATE INDEX IF NOT EXISTS idx_budget_versions_project 
ON public.budget_versions(project_id, version_number DESC);