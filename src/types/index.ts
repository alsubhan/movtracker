
export interface User {
  id: string;
  full_name: string | null;
  username: string;
  role: 'admin' | 'user' | 'operator';
  status: 'active' | 'inactive';
  createdAt: Date;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  modules: string[];
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface GateType {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface Inventory {
  id: string;
  customer: string;
  project: string;
  partition: string;
  serialNumber: string;
  status: 'in-stock' | 'in-wip' | 'dispatched' | 'damaged';
  location: string;
  inventoryType?: string;
  lastScanTime: Date;
  lastScanGate: string;
  createdAt: Date;
}

export interface InventoryType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface CustomerLocation {
  id: string;
  customer_id: string;
  location_id: string;
  location_name: string;
  rental_rates: {
    [key: string]: number; // Key is inventory type code, value is hourly rate
  };
  created_at?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: string;
  created_at?: string;
  locations?: CustomerLocation[];
}

export interface Gate {
  id: string;
  name: string;
  gate_location: string;
  type: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Movement {
  id: string;
  inventoryId: string;
  gateId: string;
  movementType: 'in' | 'out';
  timestamp: Date;
  location: string;
  previousLocation: string;
  customer?: string;
  project?: string;
  rentalStartDate?: Date | null;
  rentalCost?: number;
}

export interface Dashboard {
  warehouseInventory: {
    fgInventory: number;
    emptyInventory: number;
  };
  wipInventory: number;
  customerInventory: {
    [customer: string]: number;
  };
  overdueInventory: number;
  unusedInventory: number;
}

export interface RentalReport {
  inventoryId: string;
  inventoryType?: string;
  customer: string;
  location: string;
  status: string;
  rentalStartDate?: Date | null;
  rentalCost: number;
  daysRented: number;
  monthlyTotal: number;
  dailyAverage: number;
}

export interface CompanyInfo {
  id?: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
  header_text: string;
  footer_text: string;
  base_location_id?: string;
  base_customer_id?: string;
  created_at?: string;
}
