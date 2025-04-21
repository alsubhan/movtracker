// Define application permissions
import type { PermissionKey, Permission } from '@/types/index';

export const PERMISSIONS = {
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  INVENTORY_MANAGEMENT: 'INVENTORY_MANAGEMENT',
  INVENTORY_EDIT: 'INVENTORY_EDIT',
  GATE_MANAGEMENT: 'GATE_MANAGEMENT',
  GATE_EDIT: 'GATE_EDIT',
  BARCODE_PRINTING: 'BARCODE_PRINTING',
  INVENTORY_MOVEMENT: 'INVENTORY_MOVEMENT',
  REPORTS_VIEW: 'REPORTS_VIEW',
  SETTINGS_MANAGE: 'SETTINGS_MANAGE',
  CUSTOMER_MANAGEMENT: 'CUSTOMER_MANAGEMENT',
  LOCATION_MANAGEMENT: 'LOCATION_MANAGEMENT',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  RECEIPT_MANAGEMENT: 'RECEIPT_MANAGEMENT'
} as const;

// Define role-based permissions
export const ROLE_PERMISSIONS = {
  admin: Object.keys(PERMISSIONS) as PermissionKey[],
  user: [
    PERMISSIONS.INVENTORY_MANAGEMENT,
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.INVENTORY_MOVEMENT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.RECEIPT_MANAGEMENT,
    PERMISSIONS.LOCATION_MANAGEMENT,
    PERMISSIONS.CUSTOMER_MANAGEMENT,
  ] as PermissionKey[],
  operator: [
    PERMISSIONS.BARCODE_PRINTING,
    PERMISSIONS.RECEIPT_MANAGEMENT,
  ] as PermissionKey[],
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
    description: 'Manage inventory',
    modules: ['Inventory'],
  },
  {
    id: '3',
    name: PERMISSIONS.INVENTORY_EDIT,
    description: 'Edit inventory items',
    modules: ['Inventory'],
  },
  {
    id: '4',
    name: PERMISSIONS.GATE_MANAGEMENT,
    description: 'Manage gates',
    modules: ['Gates'],
  },
  {
    id: '5',
    name: PERMISSIONS.GATE_EDIT,
    description: 'Edit gates',
    modules: ['Gates'],
  },
  {
    id: '6',
    name: PERMISSIONS.BARCODE_PRINTING,
    description: 'Print barcodes',
    modules: ['Barcodes'],
  },
  {
    id: '7',
    name: PERMISSIONS.INVENTORY_MOVEMENT,
    description: 'Manage inventory movement',
    modules: ['Movements'],
  },
  {
    id: '8',
    name: PERMISSIONS.REPORTS_VIEW,
    description: 'View reports',
    modules: ['Reports'],
  },
  {
    id: '9',
    name: PERMISSIONS.SETTINGS_MANAGE,
    description: 'Manage system settings',
    modules: ['Settings'],
  },
  {
    id: '10',
    name: PERMISSIONS.CUSTOMER_MANAGEMENT,
    description: 'Manage customers',
    modules: ['Customers'],
  },
  {
    id: '11',
    name: PERMISSIONS.LOCATION_MANAGEMENT,
    description: 'Manage locations',
    modules: ['Locations'],
  },
  {
    id: '12',
    name: PERMISSIONS.MANAGE_USERS,
    description: 'Manage users',
    modules: ['Users'],
  },
  {
    id: '13',
    name: PERMISSIONS.MANAGE_INVENTORY,
    description: 'Manage inventory operations',
    modules: ['Inventory'],
  },
  {
    id: '14',
    name: PERMISSIONS.MANAGE_SETTINGS,
    description: 'Manage system configuration',
    modules: ['Settings'],
  },
  {
    id: 'perm_RECEIPT_MANAGEMENT',
    name: PERMISSIONS.RECEIPT_MANAGEMENT,
    description: 'Manage receipts',
    modules: ['receipts'],
  },
];

// Helper function to check if a user has a specific permission
export const hasPermission = (userRole: string, permission: PermissionKey): boolean => {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
  return rolePermissions.includes(permission);
};

// Helper function to get permissions for a role
export const getPermissionsForRole = (role: string): Permission[] => {
  const roleLower = role.toLowerCase();
  const permissionKeys = ROLE_PERMISSIONS[roleLower as keyof typeof ROLE_PERMISSIONS];
  
  if (!permissionKeys) {
    console.warn(`No permissions defined for role: ${role}`);
    return [];
  }

  return permissionKeys.map(permissionKey => {
    const permission = permissionsList.find(p => p.name === permissionKey);
    if (!permission) {
      console.warn(`Permission not found for key: ${permissionKey}`);
      return {
        id: `perm_${permissionKey}`,
        name: permissionKey,
        description: `Permission for ${permissionKey}`,
        modules: []
      };
    }
    return permission;
  });
};