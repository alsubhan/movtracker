-- Add gate_type_id column to gates table
ALTER TABLE gates ADD COLUMN IF NOT EXISTS gate_type_id UUID REFERENCES gate_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gates_gate_type_id ON gates(gate_type_id);

-- Update existing gates to use a default gate type (you'll need to replace this ID with an actual gate_type_id from your database)
-- UPDATE gates SET gate_type_id = '00000000-0000-0000-0000-000000000001' WHERE gate_type_id IS NULL;
