-- Check inventory_movements table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory_movements'
ORDER BY ordinal_position;

-- Check inventory table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;
