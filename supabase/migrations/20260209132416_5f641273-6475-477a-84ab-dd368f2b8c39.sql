
-- solicitud_documentos: documentos generados para solicitud
CREATE TABLE IF NOT EXISTS solicitud_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo VARCHAR NOT NULL,
  nombre TEXT NOT NULL,
  estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente','generando','completado','error')),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE solicitud_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitud_documentos_select" ON solicitud_documentos FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = solicitud_documentos.solicitud_id));
CREATE POLICY "solicitud_documentos_insert" ON solicitud_documentos FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = solicitud_id));
CREATE POLICY "solicitud_documentos_update" ON solicitud_documentos FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = solicitud_documentos.solicitud_id));

CREATE TRIGGER update_solicitud_documentos_updated_at BEFORE UPDATE ON solicitud_documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- tareas_solicitud: tareas por solicitud
CREATE TABLE IF NOT EXISTS tareas_solicitud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_limite DATE,
  prioridad VARCHAR DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','urgente')),
  estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_progreso','completada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tareas_solicitud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tareas_solicitud_select" ON tareas_solicitud FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = tareas_solicitud.solicitud_id));
CREATE POLICY "tareas_solicitud_insert" ON tareas_solicitud FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = solicitud_id));
CREATE POLICY "tareas_solicitud_update" ON tareas_solicitud FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = tareas_solicitud.solicitud_id));
CREATE POLICY "tareas_solicitud_delete" ON tareas_solicitud FOR DELETE USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = tareas_solicitud.solicitud_id));

CREATE TRIGGER update_tareas_solicitud_updated_at BEFORE UPDATE ON tareas_solicitud FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- analisis_solicitud: análisis de elegibilidad IA
CREATE TABLE IF NOT EXISTS analisis_solicitud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  resultado JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analisis_solicitud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analisis_solicitud_select" ON analisis_solicitud FOR SELECT USING (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = analisis_solicitud.solicitud_id));
CREATE POLICY "analisis_solicitud_insert" ON analisis_solicitud FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM projects JOIN solicitudes ON projects.id = solicitudes.project_id WHERE solicitudes.id = solicitud_id));
