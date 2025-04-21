-- Create gate_types table
CREATE TABLE IF NOT EXISTS gate_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id UUID NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, location_id)
);

-- Add gate_type_id column to gates table
ALTER TABLE gates ADD COLUMN IF NOT EXISTS gate_type_id UUID REFERENCES gate_types(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gate_types_location_id ON gate_types(location_id);
CREATE INDEX IF NOT EXISTS idx_gates_gate_type_id ON gates(gate_type_id);

-- Add RLS policies for gate_types
ALTER TABLE gate_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON gate_types
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON gate_types
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON gate_types
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Sample data for gate types (adjust IDs as needed for your database)
INSERT INTO gate_types (name, location_id, description, status)
VALUES 
  ('Receiving Gate', '00000000-0000-0000-0000-000000000001', 'Gates for receiving inventory', 'active'),
  ('Shipping Gate', '00000000-0000-0000-0000-000000000001', 'Gates for shipping inventory', 'active'),
  ('Internal Gate', '00000000-0000-0000-0000-000000000001', 'Gates for internal movement', 'active');

-- Note: Replace the location_id values with actual location IDs from your database
ALTER TABLE gate_types ADD CONSTRAINT fk_location_id FOREIGN KEY (location_id) REFERENCES locations(id);
