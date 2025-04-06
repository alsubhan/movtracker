
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
  ChevronRight
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";
import Dashboard from "../dashboard/Dashboard";
import { KeyRoundIcon, UserRound, UsersRoundIcon } from "lucide-react";
import { useState, useEffect } from "react";

export const Sidebar = () => {
  const { user, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
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
      label: "Movement",
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
      href: "/settings",
    },
  ];

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
            if (item.permission && !hasPermission(item.permission)) {
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
