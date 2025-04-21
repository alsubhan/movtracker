import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PERMISSIONS } from "@/utils/permissions";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function login(username: string, password: string): Promise<User | null> {
  return new Promise(async (resolve) => {
    try {
      // First check if the user exists in our profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('status', 'active')
        .single();

      if (profileError || !profileData) {
        console.error('User not found:', profileError);
        resolve(null);
        return;
      }

      // Verify password
      if (profileData.password !== password) {
        console.error('Invalid password');
        resolve(null);
        return;
      }

      // Get permissions from profile or use default admin permissions
      const userPermissions = profileData.permissions || Object.values(PERMISSIONS);

      // Create user data with proper type casting
      const userData: User = {
        id: profileData.id,
        full_name: profileData.full_name || 'User',
        username: profileData.username,
        role: profileData.role as 'admin' | 'user' | 'operator',
        status: profileData.status as 'active' | 'inactive',
        createdAt: new Date(profileData.created_at),
        permissions: userPermissions
      };

      // Create a session object with all required user data
      // Store full_name in session so UI can display user name
      const session = {
        user: {
          id: profileData.id,
          full_name: profileData.full_name || '',
          email: profileData.username,
          created_at: profileData.created_at,
          role: profileData.role,
          permissions: userPermissions
        }
      };

      console.log('Session data to store:', session);

      // Store session with expiration
      const expiresAt = new Date().getTime() + (60 * 60 * 1000); // 1 hour from now
      localStorage.setItem('session', JSON.stringify({
        ...session,
        expiresAt
      }));
      
      resolve(userData);
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('session');
      resolve(null);
    }
  });
}

export function logout(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      localStorage.removeItem('session');
      resolve();
    } catch (error) {
      console.error('Logout error:', error);
      resolve();
    }
  });
}

export async function hasPermission(permission: string): Promise<boolean> {
  const storedSession = localStorage.getItem('session');
  if (!storedSession) return false;

  try {
    const sessionData = JSON.parse(storedSession);
    const now = new Date().getTime();
    if (now > sessionData.expiresAt) return false;

    // Get user data from profiles table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();

    if (!profileData) return false;

    // Check if user has the permission
    return profileData.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}
