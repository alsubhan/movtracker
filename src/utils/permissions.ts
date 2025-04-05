import { Permission } from '@/types';

// Define application permissions
export const PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  INVENTORY_MANAGEMENT: 'inventory_management',
  INVENTORY_EDIT: 'inventory_edit',     // New permission for edit/delete operations
  GATE_MANAGEMENT: 'gate_management',
  GATE_EDIT: 'gate_edit',               // New permission for edit/delete operations
  BARCODE_PRINTING: 'barcode_printing',
  INVENTORY_MOVEMENT: 'inventory_movement',
  REPORTS_VIEW: 'reports_view',
  RENTAL_REPORT: 'rental_report',
  DATABASE_UTILITIES: 'database_utilities',
  SETTINGS: 'settings',
  COMPANY_SETTINGS: 'company_settings',
  CUSTOMER_EDIT: 'customer_edit',       // New permission for edit/delete operations
  LOCATION_EDIT: 'location_edit',       // New permission for edit/delete operations
  DELIVERY_CHALLAN: 'delivery_challan', // New permission for delivery challans
  LOCATION_MANAGEMENT: 'location_management', // New permission for managing locations
  CUSTOMER_MANAGEMENT: 'customer_management', // New permission for managing customers
};

// Define role-based permissions
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  user: [
    PERMISSIONS.INVENTORY_MANAGEMENT,
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.INVENTORY_MOVEMENT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.RENTAL_REPORT,
    PERMISSIONS.DELIVERY_CHALLAN,
    PERMISSIONS.LOCATION_MANAGEMENT,
    PERMISSIONS.CUSTOMER_MANAGEMENT,
  ],
  operator: [
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.INVENTORY_MOVEMENT,
    PERMISSIONS.DELIVERY_CHALLAN,
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
    modules: ['Inventory', 'Inventory Types'],
  },
  {
    id: '3',
    name: PERMISSIONS.INVENTORY_EDIT,
    description: 'Edit or delete inventory items',
    modules: ['Inventory'],
  },
  {
    id: '4',
    name: PERMISSIONS.GATE_MANAGEMENT,
    description: 'Manage gates',
    modules: ['Gates','Gate Types'],
  },
  {
    id: '5',
    name: PERMISSIONS.GATE_EDIT,
    description: 'Edit or delete gates',
    modules: ['Gates'],
  },
  {
    id: '6',
    name: PERMISSIONS.BARCODE_PRINTING,
    description: 'Print barcode labels',
    modules: ['Barcode Label Printing'],
  },
  {
    id: '7',
    name: PERMISSIONS.INVENTORY_MOVEMENT,
    description: 'Movements',
    modules: ['In Movement', 'Out Movement'],
  },
  {
    id: '8',
    name: PERMISSIONS.REPORTS_VIEW,
    description: 'View reports',
    modules: ['Movements Report', 'Missing Report'],
  },
  {
    id: '9',
    name: PERMISSIONS.DATABASE_UTILITIES,
    description: 'Database utility functions',
    modules: ['Database Utilities'],
  },
  {
    id: '10',
    name: PERMISSIONS.SETTINGS,
    description: 'Manage application settings',
    modules: ['Settings'],
  },
  {
    id: '11',
    name: PERMISSIONS.COMPANY_SETTINGS,
    description: 'Manage company settings',
    modules: ['Company Settings'],
  },
  {
    id: '12',
    name: PERMISSIONS.RENTAL_REPORT,
    description: 'View rental cost reports',
    modules: ['Rental Report'],
  },
  {
    id: '13',
    name: PERMISSIONS.CUSTOMER_EDIT,
    description: 'Edit or delete customers',
    modules: ['Customers'],
  },
  {
    id: '14',
    name: PERMISSIONS.LOCATION_EDIT,
    description: 'Edit or delete locations',
    modules: ['Locations'],
  },
  {
    id: '15',
    name: PERMISSIONS.DELIVERY_CHALLAN,
    description: 'Create delivery challans',
    modules: ['Movement'],
  },
  {
    id: '16',
    name: PERMISSIONS.LOCATION_MANAGEMENT,
    description: 'Manage locations',
    modules: ['Locations'],
  },
  {
    id: '17',
    name: PERMISSIONS.CUSTOMER_MANAGEMENT,
    description: 'Manage customers',
    modules: ['Customers'],
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