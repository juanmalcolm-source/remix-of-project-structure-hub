-- =============================================
-- PROFILES TABLE (Producer Data)
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  company_name TEXT,
  company_logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  logline TEXT,
  script_text TEXT,
  script_file_url TEXT,
  project_type TEXT CHECK (project_type IN ('largometraje', 'cortometraje', 'serie', 'documental')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- CREATIVE ANALYSIS TABLE
-- =============================================
CREATE TABLE public.creative_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  synopsis TEXT,
  core_emotional TEXT,
  central_theme TEXT,
  producibility_score INTEGER CHECK (producibility_score >= 0 AND producibility_score <= 100),
  act_structure JSONB DEFAULT '[]'::jsonb,
  emotional_curve JSONB DEFAULT '[]'::jsonb,
  turning_points JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  confidential_notes TEXT,
  viability_factors_positive JSONB DEFAULT '[]'::jsonb,
  viability_factors_negative JSONB DEFAULT '[]'::jsonb,
  estimated_budget_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project analysis" ON public.creative_analysis FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = creative_analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project analysis" ON public.creative_analysis FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = creative_analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project analysis" ON public.creative_analysis FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = creative_analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project analysis" ON public.creative_analysis FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = creative_analysis.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- CHARACTERS TABLE
-- =============================================
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('protagonista', 'principal', 'secundario', 'figuracion')),
  description TEXT,
  dramatic_arc TEXT,
  casting_suggestions JSONB DEFAULT '[]'::jsonb,
  relationships JSONB DEFAULT '[]'::jsonb,
  shooting_days INTEGER DEFAULT 0,
  daily_rate DECIMAL(10,2),
  agency_percentage DECIMAL(5,2) DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project characters" ON public.characters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project characters" ON public.characters FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project characters" ON public.characters FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project characters" ON public.characters FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- LOCATIONS TABLE
-- =============================================
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_type TEXT CHECK (location_type IN ('interior', 'exterior', 'mixto')),
  complexity TEXT CHECK (complexity IN ('baja', 'media', 'alta')),
  special_needs TEXT,
  estimated_days INTEGER DEFAULT 1,
  production_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project locations" ON public.locations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = locations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project locations" ON public.locations FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = locations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project locations" ON public.locations FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = locations.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project locations" ON public.locations FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = locations.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- SEQUENCES TABLE
-- =============================================
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  title TEXT,
  location_id UUID REFERENCES public.locations ON DELETE SET NULL,
  description TEXT,
  attrezzo JSONB DEFAULT '[]'::jsonb,
  effects JSONB DEFAULT '[]'::jsonb,
  wardrobe JSONB DEFAULT '[]'::jsonb,
  characters_in_scene JSONB DEFAULT '[]'::jsonb,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project sequences" ON public.sequences FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = sequences.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project sequences" ON public.sequences FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = sequences.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project sequences" ON public.sequences FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = sequences.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project sequences" ON public.sequences FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = sequences.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- MOOD BOARD TABLE
-- =============================================
CREATE TABLE public.mood_board (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  color_palette JSONB DEFAULT '[]'::jsonb,
  visual_references JSONB DEFAULT '[]'::jsonb,
  ai_generated_images JSONB DEFAULT '[]'::jsonb,
  cinematographic_style TEXT,
  director_references JSONB DEFAULT '[]'::jsonb,
  dop_references JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project mood board" ON public.mood_board FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = mood_board.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project mood board" ON public.mood_board FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = mood_board.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project mood board" ON public.mood_board FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = mood_board.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project mood board" ON public.mood_board FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = mood_board.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- BUDGET LINES TABLE (ICAA Format)
-- =============================================
CREATE TABLE public.budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  chapter INTEGER NOT NULL CHECK (chapter >= 1 AND chapter <= 12),
  account_number TEXT,
  concept TEXT NOT NULL,
  units DECIMAL(10,2) DEFAULT 1,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  agency_percentage DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS (units * quantity * unit_price * (1 + agency_percentage / 100)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project budget" ON public.budget_lines FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_lines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their project budget" ON public.budget_lines FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_lines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their project budget" ON public.budget_lines FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_lines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their project budget" ON public.budget_lines FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = budget_lines.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- FINANCING PLAN TABLE
-- =============================================
CREATE TABLE public.financing_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects ON DELETE CASCADE,
  director_gender TEXT CHECK (director_gender IN ('male', 'female', 'other')),
  is_debut BOOLEAN DEFAULT false,
  shooting_territory TEXT,
  total_budget DECIMAL(14,2) DEFAULT 0,
  public_intensity_percentage DECIMAL(5,2) DEFAULT 0,
  tax_incentive_territory TEXT,
  tax_incentive_percentage DECIMAL(5,2) DEFAULT 0,
  tax_incentive_amount DECIMAL(14,2) DEFAULT 0,
  investor_commission_percentage DECIMAL(5,2) DEFAULT 15,
  net_tax_incentive DECIMAL(14,2) DEFAULT 0,
  special_bonuses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financing_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their financing plan" ON public.financing_plan FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_plan.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their financing plan" ON public.financing_plan FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_plan.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their financing plan" ON public.financing_plan FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_plan.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their financing plan" ON public.financing_plan FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_plan.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- FINANCING SOURCES TABLE
-- =============================================
CREATE TABLE public.financing_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('icaa_general', 'icaa_selectiva', 'autonomica', 'coproduccion', 'preventa_tv', 'patrocinio', 'privado', 'otro')),
  source_name TEXT NOT NULL,
  amount DECIMAL(14,2) DEFAULT 0,
  status TEXT CHECK (status IN ('confirmada', 'solicitada', 'prevista')),
  expected_payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financing_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their financing sources" ON public.financing_sources FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_sources.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their financing sources" ON public.financing_sources FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_sources.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their financing sources" ON public.financing_sources FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_sources.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their financing sources" ON public.financing_sources FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = financing_sources.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- PRODUCTION NOTES TABLE
-- =============================================
CREATE TABLE public.production_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects ON DELETE CASCADE,
  personal_connection TEXT,
  artistic_vision TEXT,
  team_strengths TEXT,
  confirmed_locations TEXT,
  visual_references TEXT,
  target_audience TEXT,
  director_intentions TEXT,
  production_viability TEXT,
  aesthetic_proposal TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.production_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their production notes" ON public.production_notes FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = production_notes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert their production notes" ON public.production_notes FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = production_notes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update their production notes" ON public.production_notes FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = production_notes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete their production notes" ON public.production_notes FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = production_notes.project_id AND projects.user_id = auth.uid()));

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_creative_analysis_updated_at BEFORE UPDATE ON public.creative_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mood_board_updated_at BEFORE UPDATE ON public.mood_board FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_lines_updated_at BEFORE UPDATE ON public.budget_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financing_plan_updated_at BEFORE UPDATE ON public.financing_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financing_sources_updated_at BEFORE UPDATE ON public.financing_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_production_notes_updated_at BEFORE UPDATE ON public.production_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();