
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  Box, 
  Barcode, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  LayoutDashboard,
  DoorOpen,
  Settings,
  LogOut,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  requiredPermission?: string;
  collapsed?: boolean;
}

const SidebarItem = ({ 
  icon, 
  label, 
  href, 
  active,
  requiredPermission,
  collapsed = false 
}: SidebarItemProps) => {
  const { hasPermission } = useAuth();
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }
  
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-rfid-blue",
        active ? "bg-accent text-rfid-blue font-medium" : "text-muted-foreground",
        collapsed ? "justify-center" : ""
      )}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/auth");
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      "h-full flex flex-col bg-sidebar border-r transition-all duration-300",
      collapsed ? "w-[60px]" : "w-64"
    )}>
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-6">
            {!collapsed && (
              <Link to="/" className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-rfid-blue">
                  MovTracker
                </h2>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="ml-auto"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>
          
          {user && !collapsed && (
            <div className="mb-6 px-3 py-2 bg-muted/30 rounded-md">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
            </div>
          )}
          
          <ScrollArea className={cn(
            "overflow-y-auto",
            collapsed ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-160px)]"
          )}>
            <div className="space-y-1">
              <SidebarItem
                icon={<LayoutDashboard size={20} />}
                label="Dashboard"
                href="/"
                active={pathname === "/"}
                collapsed={collapsed}
              />
              
              <div className="mt-6">
                {!collapsed && (
                  <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                    Masters
                  </h2>
                )}
                <div className="space-y-1">
                  <SidebarItem
                    icon={<User size={20} />}
                    label="Users"
                    href="/users"
                    active={pathname === "/users"}
                    requiredPermission={PERMISSIONS.USER_MANAGEMENT}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<Box size={20} />}
                    label="Inventory"
                    href="/inventory"
                    active={pathname === "/inventory"}
                    requiredPermission={PERMISSIONS.INVENTORY_MANAGEMENT}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<MapPin size={20} />}
                    label="Locations"
                    href="/locations"
                    active={pathname === "/locations"}
                    requiredPermission={PERMISSIONS.INVENTORY_MANAGEMENT}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<DoorOpen size={20} />}
                    label="Gates"
                    href="/gates"
                    active={pathname === "/gates"}
                    requiredPermission={PERMISSIONS.GATE_MANAGEMENT}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<Building size={20} />}
                    label="Customers"
                    href="/customers"
                    active={pathname === "/customers"}
                    requiredPermission={PERMISSIONS.INVENTORY_MANAGEMENT}
                    collapsed={collapsed}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                {!collapsed && (
                  <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                    Transactions
                  </h2>
                )}
                <div className="space-y-1">
                  <SidebarItem
                    icon={<Barcode size={20} />}
                    label="Printing"
                    href="/label-printing"
                    active={pathname === "/label-printing"}
                    requiredPermission={PERMISSIONS.BARCODE_PRINTING}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<Box size={20} />}
                    label="Movement"
                    href="/movement"
                    active={pathname === "/movement"}
                    requiredPermission={PERMISSIONS.INVENTORY_MOVEMENT}
                    collapsed={collapsed}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                {!collapsed && (
                  <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                    Reports
                  </h2>
                )}
                <div className="space-y-1">
                  <SidebarItem
                    icon={<FileText size={20} />}
                    label="Movements Report"
                    href="/movement-report"
                    active={pathname === "/movement-report"}
                    requiredPermission={PERMISSIONS.REPORTS_VIEW}
                    collapsed={collapsed}
                  />
                  <SidebarItem
                    icon={<FileText size={20} />}
                    label="Missing Report"
                    href="/missing-report"
                    active={pathname === "/missing-report"}
                    requiredPermission={PERMISSIONS.REPORTS_VIEW}
                    collapsed={collapsed}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <div className="mt-auto pt-6">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full", 
                collapsed ? "justify-center" : "justify-start",
                "text-muted-foreground hover:text-destructive"
              )}
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut size={20} className={collapsed ? "" : "mr-2"} />
              {!collapsed && "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
