
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Users from "./pages/masters/Users";
import Inventory from "./pages/masters/Inventory";
import Locations from "./pages/masters/Locations";
import Gates from "./pages/masters/Gates";
import Customers from "./pages/masters/Customers";
import LabelPrinting from "./pages/transactions/LabelPrinting";
import Movement from "./pages/transactions/Movement";
import NotFound from "./pages/NotFound";
import MovementReport from "./pages/reports/MovementReport";
import MissingReport from "./pages/reports/MissingReport";
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
      <Route path="/users" element={<Users />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/gates" element={<Gates />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/label-printing" element={<LabelPrinting />} />
      <Route path="/movement" element={<Movement />} />
      <Route path="/movement-report" element={<MovementReport />} />
      <Route path="/missing-report" element={<MissingReport />} />
      <Route path="/database" element={<DatabaseUtility />} />
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
