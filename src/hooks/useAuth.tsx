
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';
import { getPermissionsForRole } from '@/utils/permissions';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Create a default admin user
  const defaultUser: User = {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    permissions: getPermissionsForRole('admin')
  };

  const [user] = useState<User>(defaultUser);

  const refreshSession = async () => {
    // No-op function since we've removed authentication
    console.log("Session refresh requested (no-op)");
  };

  const logout = async () => {
    // No-op function since we've removed authentication
    console.log("Logout requested (no-op)");
  };

  const checkPermission = (permission: string): boolean => {
    // Always return true to grant all permissions
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: true, // Always authenticated
      user, 
      refreshSession,
      logout, 
      hasPermission: checkPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
