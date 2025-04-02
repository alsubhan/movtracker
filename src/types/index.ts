

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

export interface Product {
  id: string;
  customer: string;
  project: string;
  partition: string;
  serialNumber: string;
  status: 'in-stock' | 'in-wip' | 'dispatched' | 'damaged';
  location: 'warehouse' | 'wip' | 'customer';
  lastScanTime: Date;
  lastScanGate: string;
  createdAt: Date;
}

export interface Gate {
  id: string;
  name: string;
  location: string;
  type: 'production' | 'warehouse' | 'dispatch';
  status: 'active' | 'inactive';
  antennaA: string;
  antennaB: string;
}

export interface ProductMovement {
  id: string;
  productId: string;
  gateId: string;
  movementType: 'in' | 'out';
  timestamp: Date;
  location: 'warehouse' | 'wip' | 'customer';
  previousLocation: 'warehouse' | 'wip' | 'customer';
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

