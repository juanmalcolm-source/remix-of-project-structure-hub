
-- audience_designs: resumen de análisis de mercado IA
CREATE TABLE IF NOT EXISTS public.audience_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resumen_mercado TEXT,
  segmentos_principales JSONB DEFAULT '[]'::jsonb,
  tamano_mercado_estimado NUMERIC,
  tendencias JSONB DEFAULT '[]'::jsonb,
  oportunidades JSONB DEFAULT '[]'::jsonb,
  riesgos JSONB DEFAULT '[]'::jsonb,
  recomendaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audience_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audience_designs_select" ON public.audience_designs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audience_designs.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audience_designs_insert" ON public.audience_designs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audience_designs_update" ON public.audience_designs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audience_designs.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audience_designs_delete" ON public.audience_designs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audience_designs.project_id AND projects.user_id = auth.uid())
  );

-- audiences: segmentos de público
CREATE TABLE IF NOT EXISTS public.audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  rango_edad TEXT,
  genero TEXT,
  intereses TEXT[] DEFAULT '{}',
  tamano_estimado NUMERIC,
  prioridad TEXT DEFAULT 'media',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audiences_select" ON public.audiences
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audiences.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audiences_insert" ON public.audiences
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audiences_update" ON public.audiences
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audiences.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "audiences_delete" ON public.audiences
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = audiences.project_id AND projects.user_id = auth.uid())
  );

-- buyer_personas: personajes compradores
CREATE TABLE IF NOT EXISTS public.buyer_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  edad INT,
  ocupacion TEXT,
  motivaciones TEXT[] DEFAULT '{}',
  frustraciones TEXT[] DEFAULT '{}',
  medios TEXT[] DEFAULT '{}',
  biografia TEXT,
  objetivos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_personas_select" ON public.buyer_personas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = buyer_personas.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "buyer_personas_insert" ON public.buyer_personas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "buyer_personas_update" ON public.buyer_personas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = buyer_personas.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "buyer_personas_delete" ON public.buyer_personas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = buyer_personas.project_id AND projects.user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_audience_designs_updated_at
  BEFORE UPDATE ON public.audience_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_personas_updated_at
  BEFORE UPDATE ON public.buyer_personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
