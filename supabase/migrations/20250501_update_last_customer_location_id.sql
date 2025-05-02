-- Update last_customer_location_id for existing inventory records
WITH latest_movements AS (
    SELECT DISTINCT ON (inventory_id)
        inventory_id,
        customer_location_id,
        timestamp
    FROM inventory_movements
    WHERE movement_type = 'in'
    ORDER BY inventory_id, timestamp DESC
)
UPDATE inventory
SET last_customer_location_id = latest_movements.customer_location_id
FROM latest_movements
WHERE inventory.id = latest_movements.inventory_id
AND inventory.last_customer_location_id IS NULL;
