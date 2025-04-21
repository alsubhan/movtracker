-- Remove default_code_type column from settings table
ALTER TABLE settings DROP COLUMN default_code_type;

-- Update RLS policies to remove any default_code_type related checks
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by everyone."
    ON settings FOR SELECT
    USING (true);

CREATE POLICY "Settings can be updated by authenticated users."
    ON settings FOR UPDATE
    USING (auth.role() = 'authenticated');
