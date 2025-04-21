import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          const now = new Date().getTime();
          if (now <= sessionData.expiresAt) {
            if (!requiredPermission || await hasPermission(requiredPermission)) {
              setIsAuthenticated(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredPermission]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
