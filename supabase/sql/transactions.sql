-- Create transaction management functions
CREATE OR REPLACE FUNCTION start_transaction()
RETURNS void AS $$
BEGIN
    -- This function is a placeholder since Supabase handles transactions automatically
    -- We'll use it as a marker for transaction start
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
    -- This function is a placeholder since Supabase handles transactions automatically
    -- We'll use it as a marker for transaction commit
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
    -- This function is a placeholder since Supabase handles transactions automatically
    -- We'll use it as a marker for transaction rollback
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create inventory_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id UUID NOT NULL,
    gate_id UUID NOT NULL,
    movement_type TEXT NOT NULL,
    location UUID NOT NULL,
    previous_location UUID,
    previous_status TEXT,
    new_status TEXT,
    recorded_by TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (gate_id) REFERENCES gates(id),
    FOREIGN KEY (location) REFERENCES locations(id),
    FOREIGN KEY (previous_location) REFERENCES locations(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_location ON inventory_movements(location);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_timestamp ON inventory_movements(timestamp);
