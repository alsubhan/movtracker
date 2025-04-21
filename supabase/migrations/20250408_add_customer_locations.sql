-- Create customer_locations table
create table if not exists customer_locations (
    id uuid default uuid_generate_v4() primary key,
    customer_id uuid references customers(id) not null,
    location_id uuid references locations(id) not null,
    location_name text not null,
    rental_rates jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint customer_location_unique unique(customer_id, location_id)
);

-- Create RLS policies
alter table customer_locations enable row level security;

create policy "Customer locations are viewable by authenticated users."
    on customer_locations for select
    using (auth.role() = 'authenticated');

create policy "Customer locations can be inserted by authenticated users."
    on customer_locations for insert
    with check (auth.role() = 'authenticated');

create policy "Customer locations can be updated by authenticated users."
    on customer_locations for update
    using (auth.role() = 'authenticated');

create policy "Customer locations can be deleted by authenticated users."
    on customer_locations for delete
    using (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
create or replace function update_customer_locations_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_customer_locations_updated_at
    before update on customer_locations
    for each row
    execute function update_customer_locations_updated_at();
