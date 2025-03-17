
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { 
  User, 
  Box, 
  Printer, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Database, 
  LayoutDashboard, 
  DoorOpen,
  Barcode
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => {
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

  return (
    <div className="pb-12 h-full flex flex-col bg-sidebar border-r">
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 py-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-rfid-blue">
              FG Bin Tracker
            </h2>
          </Link>
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
                  label="User Master"
                  href="/masters/user"
                  active={pathname === "/masters/user"}
                />
                <SidebarItem
                  icon={<Box size={20} />}
                  label="Bin Master"
                  href="/masters/bin"
                  active={pathname === "/masters/bin"}
                />
                <SidebarItem
                  icon={<DoorOpen size={20} />}
                  label="Gates Master"
                  href="/masters/gates"
                  active={pathname === "/masters/gates"}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-foreground">
                Transactions
              </h2>
              <div className="space-y-1">
                <SidebarItem
                  icon={<Printer size={20} />}
                  label="RFID Label Printing"
                  href="/transactions/rfid-printing"
                  active={pathname === "/transactions/rfid-printing"}
                />
                <SidebarItem
                  icon={<Barcode size={20} />}
                  label="Barcode Label Printing"
                  href="/transactions/barcode-printing"
                  active={pathname === "/transactions/barcode-printing"}
                />
                <SidebarItem
                  icon={<ArrowRight size={20} />}
                  label="Bin Out Movement"
                  href="/transactions/bin-movement?type=out"
                  active={pathname === "/transactions/bin-movement" && location.search.includes("type=out")}
                />
                <SidebarItem
                  icon={<ArrowLeft size={20} />}
                  label="Bin In Movement"
                  href="/transactions/bin-movement?type=in"
                  active={pathname === "/transactions/bin-movement" && location.search.includes("type=in")}
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
                  label="Bin Movements"
                  href="/reports/bin-movement"
                  active={pathname === "/reports/bin-movement"}
                />
                <SidebarItem
                  icon={<FileText size={20} />}
                  label="Missing Bins"
                  href="/reports/missing-bins"
                  active={pathname === "/reports/missing-bins"}
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
