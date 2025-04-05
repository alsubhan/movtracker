import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    // If logged in, redirect to home page
    if (isLoggedIn) {
      navigate("/", { replace: true });
    } else {
      // Otherwise, redirect to auth page
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default Login;
