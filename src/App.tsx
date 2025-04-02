
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import UserMaster from "./pages/masters/UserMaster";
import Products from "./pages/masters/Products";
import GatesMaster from "./pages/masters/GatesMaster";
import LabelPrinting from "./pages/transactions/LabelPrinting";
import BinMovement from "./pages/transactions/BinMovement";
import NotFound from "./pages/NotFound";
import BinMovementReport from "./pages/reports/BinMovementReport";
import MissingBinReport from "./pages/reports/MissingBinReport";
import DatabaseUtility from "./pages/utilities/DatabaseUtility";
import { AuthProvider } from "@/hooks/useAuth";

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Shorter loading time to avoid blank screen
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
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
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Index />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/masters/user" element={<UserMaster />} />
      <Route path="/masters/bin" element={<Products />} />
      <Route path="/masters/gates" element={<GatesMaster />} />
      <Route path="/transactions/label-printing" element={<LabelPrinting />} />
      <Route path="/transactions/bin-movement" element={<BinMovement />} />
      <Route path="/reports/bin-movement" element={<BinMovementReport />} />
      <Route path="/reports/missing-bins" element={<MissingBinReport />} />
      <Route path="/utilities/database" element={<DatabaseUtility />} />
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
