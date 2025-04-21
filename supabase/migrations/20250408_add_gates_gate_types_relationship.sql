-- Add foreign key relationship between gates and gate_types
alter table gates
add constraint gates_gate_type_id_fkey
foreign key (type) references gate_types(id);

-- Add index for better performance
create index if not exists idx_gates_type on gates(type);
