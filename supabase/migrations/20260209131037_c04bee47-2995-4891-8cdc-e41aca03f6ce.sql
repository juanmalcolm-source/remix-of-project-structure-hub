
-- festival_strategies
CREATE TABLE IF NOT EXISTS public.festival_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  pais TEXT,
  fecha_limite DATE,
  categoria TEXT,
  estrategia TEXT,
  prioridad TEXT DEFAULT 'media',
  estado TEXT DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.festival_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "festival_strategies_select" ON public.festival_strategies FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = festival_strategies.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "festival_strategies_insert" ON public.festival_strategies FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "festival_strategies_update" ON public.festival_strategies FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = festival_strategies.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "festival_strategies_delete" ON public.festival_strategies FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = festival_strategies.project_id AND projects.user_id = auth.uid()));

-- distribution_plans
CREATE TABLE IF NOT EXISTS public.distribution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  canal TEXT NOT NULL,
  estrategia TEXT,
  territorio TEXT,
  ventana TEXT,
  ingreso_estimado NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.distribution_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "distribution_plans_select" ON public.distribution_plans FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = distribution_plans.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "distribution_plans_insert" ON public.distribution_plans FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "distribution_plans_update" ON public.distribution_plans FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = distribution_plans.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "distribution_plans_delete" ON public.distribution_plans FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = distribution_plans.project_id AND projects.user_id = auth.uid()));

-- communication_strategies
CREATE TABLE IF NOT EXISTS public.communication_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  fase TEXT DEFAULT 'pre-lanzamiento',
  canal TEXT NOT NULL,
  accion TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  presupuesto NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communication_strategies_select" ON public.communication_strategies FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = communication_strategies.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "communication_strategies_insert" ON public.communication_strategies FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "communication_strategies_update" ON public.communication_strategies FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = communication_strategies.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "communication_strategies_delete" ON public.communication_strategies FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = communication_strategies.project_id AND projects.user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_festival_strategies_updated_at BEFORE UPDATE ON public.festival_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_distribution_plans_updated_at BEFORE UPDATE ON public.distribution_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_communication_strategies_updated_at BEFORE UPDATE ON public.communication_strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
