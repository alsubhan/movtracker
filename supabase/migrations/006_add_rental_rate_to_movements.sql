-- Add rental_rate column to inventory_movements table
alter table inventory_movements
add column rental_rate numeric(10,2);

-- Add comment for clarity
comment on column inventory_movements.rental_rate is 'The rental rate applied at the time of this movement';

-- Check actual type_ids and rental_rates data
select 
    im.id as movement_id,
    im.previous_location_id,
    im.inventory_id,
    i.type_id,
    it.code as type_code,
    cl.id as location_id,
    cl.rental_rates::text as rental_rates_json
from inventory_movements im
left join inventory i on i.id = im.inventory_id
left join inventory_types it on it.id = i.type_id
left join customer_locations cl on cl.id = im.previous_location_id
where im.previous_location_id is not null
and im.movement_type = 'out'
and not (cl.rental_rates ? it.code)
order by movement_id limit 10;

-- Update OUT movements with rental rates
update inventory_movements im
set rental_rate = (
    select 
        case 
            when cl.rental_rates ? it.code then 
                (cl.rental_rates ->> it.code)::numeric(10,2)
            else 0 -- Default to 0 if type not found in rates
        end
    from customer_locations cl
    join inventory i on i.id = im.inventory_id
    join inventory_types it on it.id = i.type_id
    where cl.id = im.previous_location_id
)
where im.previous_location_id is not null
and im.movement_type = 'out';

-- Set rental_rate to 0.00 for IN movements
update inventory_movements
set rental_rate = 0.00
where movement_type = 'in';

-- Verify no null values
select count(*) as null_count
from inventory_movements
where rental_rate is null;
