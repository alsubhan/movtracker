-- Add last_customer_location_id column to inventory table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS last_customer_location_id UUID REFERENCES customer_locations(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_last_customer_location_id ON inventory(last_customer_location_id);
