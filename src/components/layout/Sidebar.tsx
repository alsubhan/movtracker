
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  Box, 
  Barcode, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Database, 
  LayoutDashboard, 
  DoorOpen,
  Settings,
  LogOut,
  Building,
  MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  requiredPermission?: string;
}

const SidebarItem = ({ 
  icon, 
  label, 
  href, 
  active,
  requiredPermission 
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
        active ? "bg-accent text-rfid-blue font-medium" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/auth");
  };

  return (
    <div className="pb-12 h-full flex flex-col bg-sidebar border-r">
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 py-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-rfid-blue">
              MovTracker
            </h2>
          </Link>
          
          {user && (
            <div className="mb-6 px-3 py-2 bg-muted/30 rounded-md">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <SidebarItem
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              href="/"
              active={pathname === "/"}
            />
            
            <div className="mt-6">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                Masters
              </h2>
              <div className="space-y-1">
                <SidebarItem
                  icon={<User size={20} />}
                  label="Users"
                  href="/masters/user"
                  active={pathname === "/masters/user"}
                  requiredPermission={PERMISSIONS.USER_MANAGEMENT}
                />
                <SidebarItem
                  icon={<Box size={20} />}
                  label="Inventory"
                  href="/masters/bin"
                  active={pathname === "/masters/bin"}
                  requiredPermission={PERMISSIONS.BIN_MANAGEMENT}
                />
                <SidebarItem
                  icon={<MapPin size={20} />}
                  label="Locations"
                  href="/masters/locations"
                  active={pathname === "/masters/locations"}
                  requiredPermission={PERMISSIONS.BIN_MANAGEMENT}
                />
                <SidebarItem
                  icon={<DoorOpen size={20} />}
                  label="Gates"
                  href="/masters/gates"
                  active={pathname === "/masters/gates"}
                  requiredPermission={PERMISSIONS.GATE_MANAGEMENT}
                />
                <SidebarItem
                  icon={<Building size={20} />}
                  label="Customers"
                  href="/masters/customers"
                  active={pathname === "/masters/customers"}
                  requiredPermission={PERMISSIONS.BIN_MANAGEMENT}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                Transactions
              </h2>
              <div className="space-y-1">
                <SidebarItem
                  icon={<Barcode size={20} />}
                  label="Printing"
                  href="/transactions/label-printing"
                  active={pathname === "/transactions/label-printing"}
                  requiredPermission={PERMISSIONS.BARCODE_PRINTING}
                />
                <SidebarItem
                  icon={<Box size={20} />}
                  label="Movement"
                  href="/transactions/product-movement"
                  active={pathname === "/transactions/product-movement"}
                  requiredPermission={PERMISSIONS.BIN_MOVEMENT}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                Reports
              </h2>
              <div className="space-y-1">
                <SidebarItem
                  icon={<FileText size={20} />}
                  label="Movements Report"
                  href="/reports/bin-movement"
                  active={pathname === "/reports/bin-movement"}
                  requiredPermission={PERMISSIONS.REPORTS_VIEW}
                />
                <SidebarItem
                  icon={<FileText size={20} />}
                  label="Missing Report"
                  href="/reports/missing-bins"
                  active={pathname === "/reports/missing-bins"}
                  requiredPermission={PERMISSIONS.REPORTS_VIEW}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                Utilities
              </h2>
              <div className="space-y-1">
                <SidebarItem
                  icon={<Database size={20} />}
                  label="Database Utilities"
                  href="/utilities/database"
                  active={pathname === "/utilities/database"}
                  requiredPermission={PERMISSIONS.DATABASE_UTILITIES}
                />
                <SidebarItem
                  icon={<Settings size={20} />}
                  label="Settings"
                  href="/settings"
                  active={pathname === "/settings"}
                  requiredPermission={PERMISSIONS.SETTINGS}
                />
              </div>
            </div>
            
            <div className="mt-auto pt-6">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut size={20} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
