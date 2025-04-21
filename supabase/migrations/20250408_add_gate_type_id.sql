-- Add gate_type_id column to gates table
alter table gates add column if not exists gate_type_id uuid references gate_types(id);

-- Add index for better performance
create index if not exists idx_gates_gate_type_id on gates(gate_type_id);
