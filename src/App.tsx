
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AccessControl from "./pages/AccessControl";
import Dashboard from "./pages/Dashboard";
import DashboardLogs from "./pages/DashboardLogs";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import DatabaseNotFound from "./pages/DatabaseNotFound";
import CameraManagement from "./pages/CameraManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <HelmetProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/access" element={<AccessControl />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/logs" element={<DashboardLogs />} />
                <Route path="/dashboard/alerts" element={<Alerts />} />
                <Route path="/cameras" element={<CameraManagement />} />
                <Route path="/dashboard/database" element={<DatabaseNotFound />} />
                <Route path="/dashboard/database/*" element={<DatabaseNotFound />} />
                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </HelmetProvider>
        </TooltipProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
