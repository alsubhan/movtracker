
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
  rentalCost?: number;
}

export interface InventoryType {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: string;
}

export interface Gate {
  id: string;
  name: string;
  gateLocation: string;
  type: string;
  status: 'active' | 'inactive';
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
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  headerText: string;
  footerText: string;
}
