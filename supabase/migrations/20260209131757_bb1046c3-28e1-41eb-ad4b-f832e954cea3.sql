
-- convocatorias: biblioteca pública
CREATE TABLE IF NOT EXISTS public.convocatorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  organismo TEXT NOT NULL,
  ambito TEXT NOT NULL,
  tipos_obra TEXT[] DEFAULT '{}',
  descripcion TEXT,
  requisitos TEXT,
  dotacion NUMERIC,
  fecha_apertura DATE,
  fecha_cierre DATE,
  url TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.convocatorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "convocatorias_select" ON public.convocatorias FOR SELECT USING (true);

-- solicitudes: per-project
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  convocatoria_id UUID NOT NULL REFERENCES public.convocatorias(id),
  estado TEXT DEFAULT 'borrador',
  fecha_envio DATE,
  importe_solicitado NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes_select" ON public.solicitudes FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = solicitudes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "solicitudes_insert" ON public.solicitudes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_id AND projects.user_id = auth.uid()));
CREATE POLICY "solicitudes_update" ON public.solicitudes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = solicitudes.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "solicitudes_delete" ON public.solicitudes FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = solicitudes.project_id AND projects.user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_convocatorias_updated_at BEFORE UPDATE ON public.convocatorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
INSERT INTO public.convocatorias (nombre, organismo, ambito, tipos_obra, descripcion, requisitos, dotacion, fecha_apertura, fecha_cierre, url, activa) VALUES
('Ayudas a Proyectos Audiovisuales 2025', 'ICAA', 'estatal', ARRAY['largometraje','documental'], 'Apoyo a producción de obras cinematográficas', 'Obra audiovisual de creación original. Presupuesto mínimo 600.000 EUR', 30000000, '2025-02-01', '2025-04-30', 'https://www.icaa.es', true),
('Subvenciones ICEC', 'ICEC', 'estatal', ARRAY['produccion','distribucion'], 'Apoyo integral a proyectos cinematográficos', 'Proyecto viable, presupuesto mínimo 300.000 EUR', 12000000, '2025-03-01', '2025-05-31', 'https://www.icec.gob.es', true),
('Programa IVAC Cinema 2025', 'IVAC', 'autonomica', ARRAY['cortometraje','largometraje'], 'Apoyo audiovisual Comunitat Valenciana', 'Productora ubicada en CV', 5000000, '2025-01-15', '2025-03-31', 'https://www.ivac.gv.es', true),
('MEDIA - Europa Creativa', 'Comisión Europea', 'europea', ARRAY['largometraje','documental','distribucion'], 'Apoyo europeo a cine y audiovisual', 'Presupuesto mínimo 2.000.000 EUR, co-producción europea', 80000000, '2025-01-20', '2025-04-15', 'https://eacea.ec.europa.eu/media', true),
('Ibermedia 2025', 'Programa Ibermedia', 'iberoamericana', ARRAY['largometraje','documental'], 'Co-producciones iberoamericanas', 'Participación de productoras iberoamericanas', 8000000, '2025-02-15', '2025-05-30', 'https://www.ibermedia.org', true),
('Ayudas CNC Francia', 'CNC', 'europea', ARRAY['largometraje','cortometraje'], 'Francia - Apoyo a producción', 'Participación francesa', 45000000, '2025-02-01', '2025-06-30', 'https://www.cnc.fr', true),
('Berlín Pitching Forum', 'Festival de Berlín', 'privada', ARRAY['largometraje'], 'Plataforma de pitching', 'Proyecto en desarrollo', 1000000, '2025-03-01', '2025-08-31', 'https://www.berlinale.de', true),
('Euroscript Desarrollo Guiones', 'Creative Europe MEDIA', 'europea', ARRAY['guion'], 'Apoyo al desarrollo de guiones europeos', 'Guionista europeo', 500000, '2025-02-01', '2025-04-30', 'https://www.euroscript.eu', true),
('Distribución ICAA 2025', 'ICAA', 'estatal', ARRAY['distribucion'], 'Apoyo a distribución cinematográfica', 'Distribuidor registrado en ICAA', 5000000, '2025-03-15', '2025-06-30', 'https://www.icaa.es', true),
('FIPRESCI Co-financing', 'IFFR', 'privada', ARRAY['largometraje','documental'], 'Plataforma FIPRESCI para financiación', 'Proyecto de interés cultural', 2000000, '2025-01-10', '2025-12-31', 'https://iffr.com', true);
