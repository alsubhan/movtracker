-- Add location_id column to gate_types table
ALTER TABLE gate_types ADD COLUMN IF NOT EXISTS location_id UUID;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gate_types_location_id ON gate_types(location_id);

-- Add foreign key constraint (only after adding the column)
ALTER TABLE gate_types ADD CONSTRAINT fk_location_id FOREIGN KEY (location_id) REFERENCES locations(id);

-- Update the schema cache (this helps refresh the PostgREST schema cache)
NOTIFY pgrst, 'reload schema';
