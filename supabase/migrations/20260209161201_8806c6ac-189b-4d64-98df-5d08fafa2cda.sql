
-- Add new columns to convocatorias
ALTER TABLE public.convocatorias
  ADD COLUMN IF NOT EXISTS bases_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS bases_texto_extraido TEXT,
  ADD COLUMN IF NOT EXISTS bases_resumen JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create storage bucket for convocatoria documents
INSERT INTO storage.buckets (id, name, public) VALUES ('convocatoria-docs', 'convocatoria-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can read, insert, delete
CREATE POLICY "Authenticated users can read convocatoria docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'convocatoria-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload convocatoria docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'convocatoria-docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete convocatoria docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'convocatoria-docs' AND auth.uid() IS NOT NULL);
