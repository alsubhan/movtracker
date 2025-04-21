-- Create movements table
CREATE TABLE movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  notes TEXT,
  rental_rate DECIMAL(10,2),
  rental_start_date TIMESTAMP WITH TIME ZONE,
  rental_end_date TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create movement_items table
CREATE TABLE movement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_id UUID NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(movement_id, inventory_id)
);

-- Create indexes for better performance
CREATE INDEX idx_movements_location ON movements(location_id);
CREATE INDEX idx_movements_customer ON movements(customer_id);
CREATE INDEX idx_movement_items_movement ON movement_items(movement_id);
CREATE INDEX idx_movement_items_inventory ON movement_items(inventory_id);
