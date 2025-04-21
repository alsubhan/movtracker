import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/layout/Layout";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Users from "./pages/masters/Users";
import Inventory from "./pages/masters/Inventory";
import InventoryTypes from "./pages/masters/InventoryTypes";
import Locations from "./pages/masters/Locations";
import Gates from "./pages/masters/Gates";
import Customers from "./pages/masters/Customers";
import LabelPrinting from "./pages/transactions/LabelPrinting";
import Movement from "./pages/transactions/Movement"; // Added import statement
import Receipt from "./pages/transactions/Receipt"; // Added import statement
import Reports from "./pages/reports/index"; // Explicitly import our tabbed ReportsPage
import NotFound from "./pages/NotFound";
import { default as Dashboard } from "./components/dashboard/Dashboard"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          const now = new Date().getTime();
          if (now <= sessionData.expiresAt) {
            setUser(sessionData.user);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (loading) return;

    // If not authenticated and trying to access protected routes
    if (!user && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }

    // If authenticated and on login page
    if (user && location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be handled by the useEffect redirect
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory-types" element={<InventoryTypes />} />
        <Route path="locations" element={<Locations />} />
        <Route path="gates" element={<Gates />} />
        <Route path="customers" element={<Customers />} />
        <Route path="label-printing" element={<LabelPrinting />} />
        <Route path="movement" element={<Movement />} />
        <Route path="transactions/receipt" element={<Receipt />} />
        <Route path="reports" element={<Reports />} />
        {/* Redirect base settings to Company Info tab */}
        <Route path="settings" element={<Navigate to="/settings/company" replace />} />
        {/* Catch all settings subroutes */}
        <Route path="settings/*" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
