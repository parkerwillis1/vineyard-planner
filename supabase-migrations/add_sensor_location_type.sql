-- Add location_type field to distinguish field vs cellar sensors
ALTER TABLE temperature_sensors
ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'cellar'
CHECK (location_type IN ('field', 'cellar'));

-- Update existing sensors to be cellar type
UPDATE temperature_sensors
SET location_type = 'cellar'
WHERE location_type IS NULL;

-- Add comment
COMMENT ON COLUMN temperature_sensors.location_type IS 'Sensor location: field (vineyard) or cellar (winery production)';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_sensors_location_type ON temperature_sensors(location_type);
