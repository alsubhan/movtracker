
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Settings, 
  Menu, 
  ArrowLeft,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Movement Alert", message: "Inventory #1234 moved to Gate A", read: false, time: "10 min ago" },
    { id: 2, title: "New User Added", message: "Admin added a new user account", read: true, time: "1 hour ago" },
    { id: 3, title: "System Update", message: "System will be updated tonight at 10PM", read: false, time: "2 hours ago" },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read",
    });
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast({
      title: "All Notifications Read",
      description: "All notifications have been marked as read",
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been cleared",
    });
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
            Mov Tracker
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                Notifications
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {notifications.length === 0 ? (
                <div className="py-4 px-2 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex justify-between w-full">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <span className="text-sm text-muted-foreground mt-1">{notification.message}</span>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <div className="flex justify-between p-2">
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all as read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                      Clear all
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSettingsClick}>Settings</DropdownMenuItem>
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
