-- Add columns to sequences table for shooting plan data
ALTER TABLE sequences 
ADD COLUMN IF NOT EXISTS page_eighths numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS time_of_day text DEFAULT 'DÍA',
ADD COLUMN IF NOT EXISTS scene_complexity text DEFAULT 'media';

-- Create shooting_days table for persisting the shooting plan
CREATE TABLE IF NOT EXISTS shooting_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  shooting_date date,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  location_name text,
  time_of_day text DEFAULT 'DÍA',
  sequences jsonb DEFAULT '[]',
  characters jsonb DEFAULT '[]',
  total_eighths numeric DEFAULT 0,
  estimated_hours numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(project_id, day_number)
);

-- Enable RLS
ALTER TABLE shooting_days ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shooting_days
CREATE POLICY "Users can view their project shooting days" 
ON shooting_days FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = shooting_days.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert their project shooting days" 
ON shooting_days FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = shooting_days.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update their project shooting days" 
ON shooting_days FOR UPDATE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = shooting_days.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete their project shooting days" 
ON shooting_days FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = shooting_days.project_id AND projects.user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_shooting_days_updated_at
BEFORE UPDATE ON shooting_days
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();