import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import VaultOperator from "./pages/VaultOperator";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import VaultVision from "./pages/VaultVision";
import VaultFounder from "./pages/VaultFounder";
import VaultContext from "./pages/VaultContext";
import Chat from "./pages/Chat";
import CalendarPage from "./pages/CalendarPage";
import UploadData from "./pages/UploadData";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";

import { AuthGuard } from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/vault/operator" element={<VaultOperator />} />
            <Route path="/vault/vision" element={<VaultVision />} />
            <Route path="/vault/founder" element={<VaultFounder />} />
            <Route path="/vault/context" element={<VaultContext />} />
            <Route path="/upload" element={<UploadData />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
