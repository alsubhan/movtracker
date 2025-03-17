
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
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

// Auth guard component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/masters/user" element={
          <ProtectedRoute>
            <UserMaster />
          </ProtectedRoute>
        } />
        
        <Route path="/masters/bin" element={
          <ProtectedRoute>
            <BinMaster />
          </ProtectedRoute>
        } />
        
        <Route path="/masters/gates" element={
          <ProtectedRoute>
            <GatesMaster />
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/rfid-printing" element={
          <ProtectedRoute>
            <RFIDLabelPrinting />
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/barcode-printing" element={
          <ProtectedRoute>
            <BarcodeLabelPrinting />
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/bin-movement" element={
          <ProtectedRoute>
            <BinMovement />
          </ProtectedRoute>
        } />
        
        <Route path="/reports/bin-movement" element={
          <ProtectedRoute>
            <BinMovementReport />
          </ProtectedRoute>
        } />
        
        <Route path="/reports/missing-bins" element={
          <ProtectedRoute>
            <MissingBinReport />
          </ProtectedRoute>
        } />
        
        <Route path="/utilities/database" element={
          <ProtectedRoute>
            <DatabaseUtility />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
