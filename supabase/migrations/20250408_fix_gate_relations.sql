-- Create gates table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'gates'
    ) THEN
        CREATE TABLE gates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            gate_type_id UUID REFERENCES gate_types(id),
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
        );
    END IF;
END $$;

-- Add location_id column to gate_types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gate_types' AND column_name = 'location_id'
    ) THEN
        ALTER TABLE gate_types ADD COLUMN location_id UUID REFERENCES locations(id);
    END IF;
END $$;

-- Ensure proper foreign key constraint between gates and gate_types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'gates_gate_type_id_fkey'
    ) THEN
        ALTER TABLE gates ADD CONSTRAINT gates_gate_type_id_fkey 
        FOREIGN KEY (gate_type_id) REFERENCES gate_types(id);
    END IF;
END $$;
