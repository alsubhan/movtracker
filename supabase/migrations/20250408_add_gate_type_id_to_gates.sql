-- Add gate_type_id column to gates table
ALTER TABLE gates
ADD COLUMN gate_type_id UUID REFERENCES gate_types(id);

-- Add foreign key constraint
ALTER TABLE gates
ADD CONSTRAINT gates_gate_type_id_fkey
FOREIGN KEY (gate_type_id) REFERENCES gate_types(id);

-- Create index for better query performance
CREATE INDEX idx_gates_gate_type_id ON gates(gate_type_id);

-- Update existing gates to set gate_type_id (if needed)
-- This assumes you have a default gate type that you want to assign to all existing gates
-- You may need to adjust this based on your specific needs
UPDATE gates g
SET gate_type_id = (
  SELECT id FROM gate_types 
  WHERE name = 'Default' -- Change this to match your default gate type
  LIMIT 1
);
