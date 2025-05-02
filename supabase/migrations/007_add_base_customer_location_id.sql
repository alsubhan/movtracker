-- Add base_customer_location_id column to settings table
alter table settings
add column base_customer_location_id uuid;

-- Add comment for clarity
comment on column settings.base_customer_location_id is 'The ID of the base customer location for the company';
