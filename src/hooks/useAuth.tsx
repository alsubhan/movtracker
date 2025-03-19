
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { hasPermission, getPermissionsForRole } from '@/utils/permissions';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      console.log("Refreshing session...");
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.log("No session found");
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      console.log("Session found:", session.user.email);
      
      try {
        // Fetch the user profile from the profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Even if profile fetch fails, set basic authenticated state
          setIsAuthenticated(true);
          
          // Extract username from email (email format is username@example.com)
          const username = session.user.email?.split('@')[0] || 'User';
          setUser({
            id: session.user.id,
            name: username,
            email: session.user.email || '',
            role: 'user', // Default role if profile not found
            status: 'active',
            createdAt: new Date(),
            permissions: getPermissionsForRole('user')
          });
          return;
        }
        
        if (profile) {
          // Extract username from email (email format is username@example.com)
          const username = session.user.email?.split('@')[0] || 'User';
          console.log("Username extracted:", username);
          
          setIsAuthenticated(true);
          setUser({
            id: session.user.id,
            name: profile.name || username,
            email: profile.email || session.user.email || '',
            role: profile.role as 'admin' | 'user' | 'operator',
            status: profile.status as 'active' | 'inactive',
            createdAt: new Date(profile.created_at),
            permissions: getPermissionsForRole(profile.role as 'admin' | 'user' | 'operator')
          });
          
          console.log("User set:", { 
            name: profile.name || username,
            role: profile.role,
            status: profile.status
          });
        }
      } catch (profileError) {
        console.error('Error in profile handling:', profileError);
        // Set basic authentication even if profile fetch fails
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    refreshSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSession();
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
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
