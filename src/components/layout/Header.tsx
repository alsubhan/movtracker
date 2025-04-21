import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Settings, 
  Menu, 
  ArrowLeft,
  Home
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Load user profile from stored session
  const storedSession = localStorage.getItem('session');
  const user: User | null = storedSession
    ? (JSON.parse(storedSession).user as User)
    : null;
  // Generate initials: two letters from first and last name or first two letters of single name
  let initials = 'AD';
  if (user?.full_name) {
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = user.full_name.trim().substring(0, 2).toUpperCase();
    }
  }

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleSettingsClick = () => {
    navigate("/settings/ui");
  };

  const isHomePage = window.location.pathname === "/";

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2">
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Always show home button for consistent navigation */}
          {!isHomePage && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2" 
              onClick={handleBackToHome}
              title="Back to Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          
          <div className="font-semibold text-lg text-foreground">
            RENTracker
          </div>
        </div>
        
        <div className="flex items-center gap-4">

          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettingsClick}>UI Settings</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => {
                  localStorage.removeItem("isLoggedIn");
                  navigate("/login");
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
