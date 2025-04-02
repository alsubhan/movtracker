
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSIONS } from "@/utils/permissions";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock user for development
  useEffect(() => {
    const mockUser: User = {
      id: "1",
      full_name: "John Smith",
      username: "admin",
      role: "admin",
      status: "active",
      createdAt: new Date(),
      permissions: Object.values(PERMISSIONS),
    };
    
    setUser(mockUser);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      // In a real app, this would authenticate with Supabase
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email: username,
      //   password,
      // });
      // if (error) throw error;

      // Mock successful login
      const mockUser: User = {
        id: "1",
        full_name: "John Smith",
        username: "admin",
        role: "admin",
        status: "active",
        createdAt: new Date(),
        permissions: Object.values(PERMISSIONS),
      };

      setUser(mockUser);
      return mockUser;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // In a real app, this would sign out from Supabase
      // await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
