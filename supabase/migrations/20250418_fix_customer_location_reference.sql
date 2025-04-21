-- Add customer_location_id column to profiles table referencing customer_locations.id
ALTER TABLE profiles
ADD COLUMN customer_location_id UUID REFERENCES customer_locations(id);

-- Add a comment to the column for documentation
COMMENT ON COLUMN profiles.customer_location_id IS 'Reference to the customer location that this user is assigned to';

-- Add a foreign key constraint
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_customer_location
FOREIGN KEY (customer_location_id) REFERENCES customer_locations(id)
ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX idx_profiles_customer_location ON profiles(customer_location_id);
