import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Upload from "./pages/Upload";
import Analisis from "./pages/Analisis";
import Overview from "./pages/creativa/Overview";
import AnalisisNarrativo from "./pages/creativa/AnalisisNarrativo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/analisis-narrativo" element={<AnalisisNarrativo />} />
          <Route path="/analisis" element={<Analisis />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
