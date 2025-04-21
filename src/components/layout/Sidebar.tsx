import { 
  BarChart4, 
  Home, 
  LayoutDashboard,
  Layers, 
  Boxes, 
  BoxSelect, 
  MapPin, 
  Store, 
  Tag, 
  FileText, 
  Settings,
  Truck,
  Barcode,
  DoorOpenIcon,
  BookUserIcon,
  BoxIcon,
  ChevronLeft,
  ChevronRight,
  PackageCheckIcon
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { hasPermission } from "@/hooks/useAuth";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/utils/permissions";
import { KeyRoundIcon, UserRound, UsersRoundIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";

export const Sidebar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Check session and load permissions on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          const now = new Date().getTime();
          if (now <= sessionData.expiresAt) {
            // Get user data from session
            const userData = sessionData.user as User;
            setUser(userData);
            
            // Get permissions based on user's role
            const userPermissions = ROLE_PERMISSIONS[userData.role as keyof typeof ROLE_PERMISSIONS] || [];
            console.log('User role:', userData.role);
            console.log('User permissions:', userPermissions);
            setPermissions(userPermissions);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Navigation items with icons
  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: UsersRoundIcon,
      label: "Users",
      href: "/users",
      permission: PERMISSIONS.USER_MANAGEMENT,
    },
    {
      icon: BoxIcon,
      label: "Inventory",
      href: "/inventory",
      permission: PERMISSIONS.INVENTORY_MANAGEMENT,
    },
    {
      icon: MapPin,
      label: "Locations",
      href: "/locations",
      permission: PERMISSIONS.LOCATION_MANAGEMENT,
    },
    {
      icon: PackageCheckIcon,
      label: "Receipts",
      href: "/transactions/receipt",
      permission: PERMISSIONS.RECEIPT_MANAGEMENT,
    },
    {
      icon: DoorOpenIcon,
      label: "Gates",
      href: "/gates",
      permission: PERMISSIONS.GATE_MANAGEMENT,
    },
    {
      icon: BookUserIcon,
      label: "Customers",
      href: "/customers",
      permission: PERMISSIONS.CUSTOMER_MANAGEMENT,
    },
    {
      icon: Barcode,
      label: "Printing",
      href: "/label-printing",
      permission: PERMISSIONS.BARCODE_PRINTING,
    },
    {
      icon: Truck,
      label: "Movements",
      href: "/movement",
      permission: PERMISSIONS.INVENTORY_MOVEMENT,
    },
    {
      icon: FileText,
      label: "Reports",
      href: "/reports",
      permission: PERMISSIONS.REPORTS_VIEW,
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings/company",
      permission: PERMISSIONS.SETTINGS_MANAGE,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-secondary border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("p-4 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <a className="flex items-center gap-2" href="/">
            <h2 className="text-xl font-bold tracking-tight text-rfid-blue">RENTracker</h2>
          </a>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4">
          {navItems.map((item, index) => {
            // Always show Dashboard and Settings
            if (!item.permission) return (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 px-4 py-2 hover:bg-secondary/50 rounded-md transition-colors duration-200",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-secondary/50 font-medium"
                      : "text-muted-foreground"
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );

            // For items with permissions, check if user has the required permission
            const hasPermission = permissions.includes(item.permission);
            console.log(`Checking permission for ${item.label}: ${hasPermission}`);
            
            if (!hasPermission) {
              return null;
            }

            return (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 px-4 py-2 hover:bg-secondary/50 rounded-md transition-colors duration-200",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-secondary/50 font-medium"
                      : "text-muted-foreground"
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
