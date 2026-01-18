-- Add physical location fields to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS zone TEXT,
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.locations.address IS 'User-entered address or description';
COMMENT ON COLUMN public.locations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN public.locations.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN public.locations.zone IS 'Zone/area grouping for optimization';
COMMENT ON COLUMN public.locations.place_id IS 'Google Maps Place ID for future integration';
COMMENT ON COLUMN public.locations.formatted_address IS 'Formatted address from Google Maps';