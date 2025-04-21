export interface User {
  id: string;
  full_name: string | null;
  username: string;
  role: 'admin' | 'user' | 'operator';
  status: 'active' | 'inactive';
  createdAt: string;
  permissions: Permission[];
  password: string;
  customer_location_id: string | null;
}

// Partial type for form data where some fields can be optional
export type PartialFormData = Partial<User> & {
  password?: string;
  customer_location_id?: string;
};

// Type for form data that includes all required fields
export type FormData = User & {
  password?: string;
  customer_location_id?: string;
};

export type PermissionKey =
  'USER_MANAGEMENT' | 'INVENTORY_MANAGEMENT' | 'INVENTORY_EDIT' |
  'GATE_MANAGEMENT' | 'GATE_EDIT' | 'BARCODE_PRINTING' |
  'INVENTORY_MOVEMENT' | 'REPORTS_VIEW' | 'SETTINGS_MANAGE' |
  'CUSTOMER_MANAGEMENT' | 'LOCATION_MANAGEMENT' | 'MANAGE_USERS' |
  'MANAGE_INVENTORY' | 'MANAGE_SETTINGS' | 'DELIVERY_CHALLAN' |
  'RECEIPT_MANAGEMENT';

export type Permission = {
  id: string;
  name: PermissionKey;
  description: string;
  modules: string[];
};

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
  status: 'In-Stock' | 'In-Transit' | 'Received' | 'Returned';
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
  rental_rates: { [key: string]: number };
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  locations?: CustomerLocation[];  // Optional array of locations associated with the customer
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
  customer_location_id: string;
  previous_location_id: string;
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
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  header_text: string;
  footer_text: string;
  base_location_id: string;
  base_customer_id: string;
  created_at?: string;
}
