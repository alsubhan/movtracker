-- Add a reference_id column to link round-trip movements
ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Optional: create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference_id ON inventory_movements(reference_id);
