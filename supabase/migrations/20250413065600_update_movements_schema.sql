-- Add location_id and previous_location_id columns to inventory_movements table
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
ADD COLUMN IF NOT EXISTS previous_location_id UUID REFERENCES locations(id);

-- Update existing data to set location_id and previous_location_id
UPDATE inventory_movements
SET location_id = locations.id
FROM locations
WHERE inventory_movements.location = locations.name;

UPDATE inventory_movements
SET previous_location_id = locations.id
FROM locations
WHERE inventory_movements.previous_location = locations.name;

-- Drop old columns
ALTER TABLE inventory_movements
DROP COLUMN IF EXISTS location,
DROP COLUMN IF EXISTS previous_location;
