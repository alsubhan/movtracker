
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
    } else {
      // Otherwise redirect to the Auth page
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // This will only be visible momentarily before redirection
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => navigate('/auth')}>
        Go to Login Page
      </Button>
    </div>
  );
};

export default Login;
