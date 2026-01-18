-- Create table for distance matrix between locations
CREATE TABLE public.location_distances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  to_location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  distance_km DECIMAL(10, 2),
  duration_minutes INTEGER,
  source TEXT DEFAULT 'manual', -- 'manual', 'google_maps', 'estimated'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, from_location_id, to_location_id)
);

-- Enable RLS
ALTER TABLE public.location_distances ENABLE ROW LEVEL SECURITY;

-- Create policies (users can manage distances for their own projects)
CREATE POLICY "Users can view distances for their projects"
ON public.location_distances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = location_distances.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert distances for their projects"
ON public.location_distances FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = location_distances.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update distances for their projects"
ON public.location_distances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = location_distances.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete distances for their projects"
ON public.location_distances FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = location_distances.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_location_distances_updated_at
BEFORE UPDATE ON public.location_distances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();