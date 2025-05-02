-- Add updated_at column to customer_locations
ALTER TABLE customer_locations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
