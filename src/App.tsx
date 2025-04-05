
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Users from "./pages/masters/Users";
import Inventory from "./pages/masters/Inventory";
import InventoryTypes from "./pages/masters/InventoryTypes";
import Locations from "./pages/masters/Locations";
import Gates from "./pages/masters/Gates";
import Customers from "./pages/masters/Customers";
import LabelPrinting from "./pages/transactions/LabelPrinting";
import Movement from "./pages/transactions/Movement";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import { AuthProvider } from "@/hooks/useAuth";

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a shorter loading time to avoid blank screen
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

  // All routes use the layout and are accessible without login
  return (
    <Routes>
      <Route path="/" element={<Layout><Index /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="/users" element={<Layout><Users /></Layout>} />
      <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
      <Route path="/inventory-types" element={<Layout><InventoryTypes /></Layout>} />
      <Route path="/locations" element={<Layout><Locations /></Layout>} />
      <Route path="/gates" element={<Layout><Gates /></Layout>} />
      <Route path="/customers" element={<Layout><Customers /></Layout>} />
      <Route path="/label-printing" element={<Layout><LabelPrinting /></Layout>} />
      <Route path="/movement" element={<Layout><Movement /></Layout>} />
      <Route path="/reports" element={<Layout><Reports /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth" element={<Auth />} />
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
