import { Database } from './supabase.types';

export type Settings = Database['public']['Tables']['settings']['Row'];
export type CompanyInfo = Database['public']['Tables']['company_info']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Gate = Database['public']['Tables']['gates']['Row'];
export type GateType = Database['public']['Tables']['gate_types']['Row'];
export type InventoryType = Database['public']['Tables']['inventory_types']['Row'];
export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type CodeType = 'customer' | 'type' | 'company';
