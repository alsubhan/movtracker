-- Check full schema and constraints
-- Get table definition
SELECT pg_get_tabledef('inventory_movements'::regclass);

-- Get all constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as definition
FROM 
    pg_constraint c 
JOIN 
    pg_namespace n ON n.oid = c.connamespace
WHERE 
    conrelid = 'inventory_movements'::regclass
ORDER BY 
    contype DESC, conname;

-- Get indexes
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'inventory_movements'
ORDER BY 
    indexname;
