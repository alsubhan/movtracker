-- Create settings table
create table if not exists settings (
    id uuid default uuid_generate_v4() primary key,
    default_code_type text check (default_code_type in ('customer', 'type', 'company')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table settings enable row level security;

create policy "Settings are viewable by everyone."
    on settings for select
    using (true);

create policy "Settings can be updated by authenticated users."
    on settings for update
    using (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_settings_updated_at
    before update on settings
    for each row
    execute function update_updated_at_column();
