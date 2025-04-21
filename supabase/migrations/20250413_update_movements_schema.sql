-- Rename existing columns to old names
ALTER TABLE inventory_movements
RENAME COLUMN location TO old_location,
RENAME COLUMN previous_location TO old_previous_location;

-- Add new columns with customer prefix
ALTER TABLE inventory_movements
ADD COLUMN customer_location_id UUID REFERENCES customer_locations(id),
ADD COLUMN previous_location_id UUID REFERENCES customer_locations(id);

-- Update existing data
UPDATE inventory_movements
SET customer_location_id = old_location::uuid,
    previous_location_id = old_previous_location::uuid;

-- Drop old columns
ALTER TABLE inventory_movements
DROP COLUMN old_location,
DROP COLUMN old_previous_location;

-- Update movement types constraint
ALTER TABLE inventory_movements
DROP CONSTRAINT IF EXISTS bin_movements_movement_type_check,
ADD CONSTRAINT bin_movements_movement_type_check
CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT'));
