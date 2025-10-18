import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Governance from "./pages/Governance";
import Risk from "./pages/Risk";
import Compliance from "./pages/Compliance";
import DocumentRepository from "./pages/DocumentRepository";
import Objectives from "./pages/Objectives";
import Audit from "./pages/Audit";
import Controls from "./pages/Controls";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/risk" element={<Risk />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/documents" element={<DocumentRepository />} />
          <Route path="/objectives" element={<Objectives />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/controls" element={<Controls />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
