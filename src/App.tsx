
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import UserMaster from "./pages/masters/UserMaster";
import BinMaster from "./pages/masters/BinMaster";
import GatesMaster from "./pages/masters/GatesMaster";
import RFIDLabelPrinting from "./pages/transactions/RFIDLabelPrinting";
import BarcodeLabelPrinting from "./pages/transactions/BarcodeLabelPrinting";
import BinMovement from "./pages/transactions/BinMovement";
import NotFound from "./pages/NotFound";
import BinMovementReport from "./pages/reports/BinMovementReport";
import MissingBinReport from "./pages/reports/MissingBinReport";
import DatabaseUtility from "./pages/utilities/DatabaseUtility";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";

// Auth guard component with permission check
const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission?: string;
}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking auth status
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.SETTINGS}>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/masters/user" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.USER_MANAGEMENT}>
          <UserMaster />
        </ProtectedRoute>
      } />
      
      <Route path="/masters/bin" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.BIN_MANAGEMENT}>
          <BinMaster />
        </ProtectedRoute>
      } />
      
      <Route path="/masters/gates" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.GATE_MANAGEMENT}>
          <GatesMaster />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions/rfid-printing" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.RFID_PRINTING}>
          <RFIDLabelPrinting />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions/barcode-printing" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.BARCODE_PRINTING}>
          <BarcodeLabelPrinting />
        </ProtectedRoute>
      } />
      
      <Route path="/transactions/bin-movement" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.BIN_MOVEMENT}>
          <BinMovement />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/bin-movement" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
          <BinMovementReport />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/missing-bins" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
          <MissingBinReport />
        </ProtectedRoute>
      } />
      
      <Route path="/utilities/database" element={
        <ProtectedRoute requiredPermission={PERMISSIONS.DATABASE_UTILITIES}>
          <DatabaseUtility />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
