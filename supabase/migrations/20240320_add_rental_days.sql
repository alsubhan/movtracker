-- Add rental_days column to customer_locations table
ALTER TABLE customer_locations
ADD COLUMN IF NOT EXISTS rental_days INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN customer_locations.rental_days IS 'Number of days for which the rental is valid'; 