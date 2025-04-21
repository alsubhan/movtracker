export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email?: string;  // Optional email field
  role: 'admin' | 'user' | 'operator';
  status: 'active' | 'inactive';
  created_at: string;
  password: string;
  permissions: string[];
}

import type { PermissionKey } from './types/index';

export interface User {
  id: string;
  full_name: string;
  username: string;
  role: 'admin' | 'user' | 'operator';
  status: 'active' | 'inactive';
  createdAt: Date;
  permissions: PermissionKey[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => Promise<boolean>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export type MovementType = 'transfer' | 'return' | 'rental' | 'repair';

export interface Movement {
  id: string;
  inventory_id: string;
  gate_id: string;
  movement_type: MovementType;
  timestamp: string;
  location_id: string;
  previous_location_id: string;
  recorded_by: string;
  location_name?: string;
  previous_location_name?: string;
}

// Re-export types from the types directory to allow importing from '@/types'
export * from './types/index';
