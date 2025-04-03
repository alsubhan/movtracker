
import { Permission } from '@/types';

// Define application permissions
export const PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  INVENTORY_MANAGEMENT: 'inventory_management',
  GATE_MANAGEMENT: 'gate_management',
  BARCODE_PRINTING: 'barcode_printing', // This is now the primary permission
  INVENTORY_MOVEMENT: 'inventory_movement',
  REPORTS_VIEW: 'reports_view',
  DATABASE_UTILITIES: 'database_utilities',
  SETTINGS: 'settings',
};

// Define role-based permissions
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  user: [
    PERMISSIONS.INVENTORY_MANAGEMENT,
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.INVENTORY_MOVEMENT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  operator: [
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.INVENTORY_MOVEMENT,
  ],
};

// List of all permissions with descriptions
export const permissionsList: Permission[] = [
  {
    id: '1',
    name: PERMISSIONS.USER_MANAGEMENT,
    description: 'Manage user accounts',
    modules: ['Users'],
  },
  {
    id: '2',
    name: PERMISSIONS.INVENTORY_MANAGEMENT,
    description: 'Manage Inventory',
    modules: ['Inventory'],
  },
  {
    id: '3',
    name: PERMISSIONS.GATE_MANAGEMENT,
    description: 'Manage gates',
    modules: ['Gates','Gate Types'],
  },
  {
    id: '4',
    name: PERMISSIONS.BARCODE_PRINTING,
    description: 'Print barcode labels',
    modules: ['Barcode Label Printing'],
  },
  {
    id: '5',
    name: PERMISSIONS.INVENTORY_MOVEMENT,
    description: 'Movements',
    modules: ['In Movement', 'Out Movement'],
  },
  {
    id: '6',
    name: PERMISSIONS.REPORTS_VIEW,
    description: 'View reports',
    modules: ['Movements Report', 'Missing Report'],
  },
  {
    id: '7',
    name: PERMISSIONS.DATABASE_UTILITIES,
    description: 'Database utility functions',
    modules: ['Database Utilities'],
  },
  {
    id: '8',
    name: PERMISSIONS.SETTINGS,
    description: 'Manage application settings',
    modules: ['Settings'],
  },
];

// Helper function to check if a user has a specific permission
export const hasPermission = (userRole: string, permission: string): boolean => {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
  return rolePermissions.includes(permission);
};

// Helper function to get permissions for a role
export const getPermissionsForRole = (role: 'admin' | 'user' | 'operator'): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};
