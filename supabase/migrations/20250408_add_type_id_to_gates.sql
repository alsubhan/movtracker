-- Add type_id column to gates table
ALTER TABLE gates ADD COLUMN type_id UUID REFERENCES gate_types(id);

-- Add index for better query performance
CREATE INDEX idx_gates_type_id ON gates(type_id);
