-- Trigger to auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_updated_at_customer_locations ON customer_locations;
CREATE TRIGGER trigger_updated_at_customer_locations
BEFORE UPDATE ON customer_locations
FOR EACH ROW EXECUTE PROCEDURE set_timestamp_updated_at();
