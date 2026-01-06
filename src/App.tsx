import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Upload from "./pages/Upload";
import Perfil from "./pages/Perfil";
import Analisis from "./pages/Analisis";

// Proyecto (Creative) Pages
import OverviewPage from "./pages/proyecto/OverviewPage";
import NarrativoPage from "./pages/proyecto/NarrativoPage";
import PersonajesPage from "./pages/proyecto/PersonajesPage";
import VentajasPage from "./pages/proyecto/VentajasPage";
import ViabilidadPage from "./pages/proyecto/ViabilidadPage";
import MoodBoardPage from "./pages/proyecto/MoodBoardPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/analisis" element={<ProtectedRoute><Analisis /></ProtectedRoute>} />
            
            {/* Proyecto (Creative) routes */}
            <Route path="/proyecto/overview" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
            <Route path="/proyecto/narrativo" element={<ProtectedRoute><NarrativoPage /></ProtectedRoute>} />
            <Route path="/proyecto/personajes" element={<ProtectedRoute><PersonajesPage /></ProtectedRoute>} />
            <Route path="/proyecto/ventajas" element={<ProtectedRoute><VentajasPage /></ProtectedRoute>} />
            <Route path="/proyecto/viabilidad" element={<ProtectedRoute><ViabilidadPage /></ProtectedRoute>} />
            <Route path="/proyecto/moodboard" element={<ProtectedRoute><MoodBoardPage /></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
