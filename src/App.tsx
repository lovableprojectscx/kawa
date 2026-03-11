import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProjectsPage from "./pages/ProjectsPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import VaultFounder from "./pages/VaultFounder";
import VaultContext from "./pages/VaultContext";
import VaultContacts from "./pages/VaultContacts";
import Chat from "./pages/Chat";
import CompaniesPage from "./pages/CompaniesPage";
import CalendarPage from "./pages/CalendarPage";
import Settings from "./pages/Settings";
import LandingPage from "./pages/landing/LandingPage";
import FeaturesPage from "./pages/landing/FeaturesPage";
import PricingPage from "./pages/landing/PricingPage";
import { AuthGuard } from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vault/operator" element={<ProjectsPage />} />
            <Route path="/vault/companies" element={<CompaniesPage />} />
            <Route path="/vault/founder" element={<VaultFounder />} />
            <Route path="/vault/context" element={<VaultContext />} />
            <Route path="/vault/contacts" element={<VaultContacts />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<Settings />} />
            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
            <Route path="/insights" element={<Navigate to="/chat" replace />} />
            <Route path="/upload" element={<Navigate to="/chat" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
