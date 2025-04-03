
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

export interface ProductLocation {
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

export interface Product {
  id: string;
  customer: string;
  project: string;
  partition: string;
  serialNumber: string;
  status: 'in-stock' | 'in-wip' | 'dispatched' | 'damaged';
  location: string;
  lastScanTime: Date;
  lastScanGate: string;
  createdAt: Date;
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

export interface ProductMovement {
  id: string;
  productId: string;
  gateId: string;
  movementType: 'in' | 'out';
  timestamp: Date;
  location: string;
  previousLocation: string;
}

export interface Dashboard {
  warehouseProducts: {
    fgProducts: number;
    emptyProducts: number;
  };
  wipProducts: number;
  customerProducts: {
    [customer: string]: number;
  };
  overdueProducts: number;
  unusedProducts: number;
}
