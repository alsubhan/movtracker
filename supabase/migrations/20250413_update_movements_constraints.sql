-- Drop existing foreign key constraints
ALTER TABLE inventory_movements
DROP CONSTRAINT IF EXISTS inventory_movements_location_id_fkey,
DROP CONSTRAINT IF EXISTS inventory_movements_previous_location_id_fkey;

-- Add new foreign key constraints referencing customer_locations
ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_customer_location_id_fkey
FOREIGN KEY (customer_location_id) REFERENCES customer_locations(id) ON DELETE CASCADE,
ADD CONSTRAINT inventory_movements_previous_location_id_fkey
FOREIGN KEY (previous_location_id) REFERENCES customer_locations(id) ON DELETE CASCADE;

-- Update existing data to ensure all references are valid
UPDATE inventory_movements
SET customer_location_id = NULL
WHERE customer_location_id NOT IN (SELECT id FROM customer_locations);

UPDATE inventory_movements
SET previous_location_id = NULL
WHERE previous_location_id NOT IN (SELECT id FROM customer_locations);
