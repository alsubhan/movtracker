
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { hasPermission, getPermissionsForRole } from '@/utils/permissions';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      const username = localStorage.getItem('username') || '';
      const userRole = localStorage.getItem('userRole') || 'user';
      
      setIsAuthenticated(true);
      setUser({
        id: '1',
        name: username,
        email: `${username.toLowerCase()}@example.com`,
        role: userRole as 'admin' | 'user' | 'operator',
        status: 'active',
        createdAt: new Date(),
        permissions: getPermissionsForRole(userRole as 'admin' | 'user' | 'operator')
      });
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // In a real app, you would validate against a backend
    // For now, we'll set a default role based on username (for demo purposes)
    let role: 'admin' | 'user' | 'operator' = 'user';
    
    if (username.toLowerCase().includes('admin')) {
      role = 'admin';
    } else if (username.toLowerCase().includes('operator')) {
      role = 'operator';
    }
    
    // Store login info in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role);
    
    // Update state
    setIsAuthenticated(true);
    setUser({
      id: '1',
      name: username,
      email: `${username.toLowerCase()}@example.com`,
      role: role,
      status: 'active',
      createdAt: new Date(),
      permissions: getPermissionsForRole(role)
    });
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(null);
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
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
