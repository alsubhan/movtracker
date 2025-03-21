
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Immediately redirect to home page
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button onClick={() => navigate('/')}>
        Go to Home Page
      </Button>
    </div>
  );
};

export default Auth;
