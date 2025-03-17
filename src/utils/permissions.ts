
import { Permission } from '@/types';

// Define application permissions
export const PERMISSIONS = {
  USER_MANAGEMENT: 'user_management',
  BIN_MANAGEMENT: 'bin_management',
  GATE_MANAGEMENT: 'gate_management',
  RFID_PRINTING: 'rfid_printing',
  BARCODE_PRINTING: 'barcode_printing',
  BIN_MOVEMENT: 'bin_movement',
  REPORTS_VIEW: 'reports_view',
  DATABASE_UTILITIES: 'database_utilities',
  SETTINGS: 'settings',
};

// Define role-based permissions
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  user: [
    PERMISSIONS.BIN_MANAGEMENT,
    PERMISSIONS.RFID_PRINTING,
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.BIN_MOVEMENT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  operator: [
    PERMISSIONS.RFID_PRINTING,
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.BIN_MOVEMENT,
  ],
};

// List of all permissions with descriptions
export const permissionsList: Permission[] = [
  {
    id: '1',
    name: PERMISSIONS.USER_MANAGEMENT,
    description: 'Manage user accounts',
    modules: ['User Master'],
  },
  {
    id: '2',
    name: PERMISSIONS.BIN_MANAGEMENT,
    description: 'Manage bins',
    modules: ['Bin Master'],
  },
  {
    id: '3',
    name: PERMISSIONS.GATE_MANAGEMENT,
    description: 'Manage gates',
    modules: ['Gates Master'],
  },
  {
    id: '4',
    name: PERMISSIONS.RFID_PRINTING,
    description: 'Print RFID labels',
    modules: ['RFID Label Printing'],
  },
  {
    id: '5',
    name: PERMISSIONS.BARCODE_PRINTING,
    description: 'Print barcode labels',
    modules: ['Barcode Label Printing'],
  },
  {
    id: '6',
    name: PERMISSIONS.BIN_MOVEMENT,
    description: 'Track bin movements',
    modules: ['Bin In Movement', 'Bin Out Movement'],
  },
  {
    id: '7',
    name: PERMISSIONS.REPORTS_VIEW,
    description: 'View reports',
    modules: ['Bin Movements', 'Missing Bins'],
  },
  {
    id: '8',
    name: PERMISSIONS.DATABASE_UTILITIES,
    description: 'Database utility functions',
    modules: ['Database Utilities'],
  },
  {
    id: '9',
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
