
import { 
  BarChart4, 
  Home, 
  CircleUser, 
  Layers, 
  Boxes, 
  BoxSelect, 
  MapPin, 
  Store, 
  Tag, 
  FileText, 
  Settings,
  Truck
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";

export const Sidebar = () => {
  const { user, hasPermission, logout } = useAuth();

  // Navigation items with icons
  const navItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: CircleUser,
      label: "Users",
      href: "/users",
      permission: PERMISSIONS.USER_MANAGEMENT,
    },
    {
      icon: Boxes,
      label: "Inventory",
      href: "/inventory",
      permission: PERMISSIONS.INVENTORY_MANAGEMENT,
    },
    {
      icon: BoxSelect,
      label: "Inventory Types",
      href: "/inventory-types",
      permission: PERMISSIONS.INVENTORY_MANAGEMENT,
    },
    {
      icon: MapPin,
      label: "Locations",
      href: "/locations",
      permission: PERMISSIONS.LOCATION_MANAGEMENT,
    },
    {
      icon: Store,
      label: "Gates",
      href: "/gates",
      permission: PERMISSIONS.GATE_MANAGEMENT,
    },
    {
      icon: Tag,
      label: "Customers",
      href: "/customers",
      permission: PERMISSIONS.CUSTOMER_MANAGEMENT,
    },
    {
      icon: Layers,
      label: "Label Printing",
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
    <div className="flex flex-col h-screen bg-secondary border-r">
      <div className="p-4 flex items-center justify-center">
        <span className="font-bold text-lg">MovTracker</span>
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
                    isActive
                      ? "bg-secondary/50 font-medium"
                      : "text-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </ScrollArea>
      {user && (
        <div className="p-4">
          <Button variant="outline" className="w-full" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};
