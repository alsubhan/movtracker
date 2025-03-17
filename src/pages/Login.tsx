
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    // Login using our auth hook
    const success = login(username, password);
    
    if (success) {
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });
      
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 space-y-8 bg-background rounded-lg shadow-lg border">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-rfid-blue">FG Bin Tracking System</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to continue</p>
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
            <p>Hint: Include "admin" or "operator" in your username</p>
            <p>to log in with those roles, otherwise defaults to "user"</p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full flex items-center justify-center">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
