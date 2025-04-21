-- Drop foreign key constraints first
ALTER TABLE gates DROP CONSTRAINT IF EXISTS gates_type_id_fkey;

-- Drop the redundant columns
ALTER TABLE gates 
DROP COLUMN IF EXISTS type,
DROP COLUMN IF EXISTS type_id;

-- Add location_id column if it doesn't exist
ALTER TABLE gates 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
ALTER COLUMN gate_type_id SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'active';

-- Make location_id NOT NULL
ALTER TABLE gates 
ALTER COLUMN location_id SET NOT NULL;

-- Add proper constraints
ALTER TABLE gates 
ADD CONSTRAINT gates_gate_type_id_fkey 
FOREIGN KEY (gate_type_id) 
REFERENCES gate_types(id) 
ON DELETE RESTRICT;

-- Add a comment explaining the relationship
COMMENT ON COLUMN gates.gate_type_id IS 'Reference to the gate type that defines this gate''s purpose';
