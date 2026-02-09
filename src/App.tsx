import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Proyectos from "./pages/Proyectos";
import Perfil from "./pages/Perfil";
import Analisis from "./pages/Analisis";
import DashboardPage from "./pages/DashboardPage";

// Proyecto (Creative) Pages
import OverviewPage from "./pages/proyecto/OverviewPage";
import NarrativoPage from "./pages/proyecto/NarrativoPage";
import PersonajesPage from "./pages/proyecto/PersonajesPage";
import VentajasPage from "./pages/proyecto/VentajasPage";
import ViabilidadPage from "./pages/proyecto/ViabilidadPage";
import MoodBoardPage from "./pages/proyecto/MoodBoardPage";
import ProyectoConfiguracionPage from "./pages/proyecto/ConfiguracionPage";

// Produccion Pages
import DesglosePage from "./pages/produccion/DesglosePage";
import DesglosePersonajesPage from "./pages/produccion/DesglosePersonajesPage";
import DesgloseLocalizacionesPage from "./pages/produccion/DesgloseLocalizacionesPage";
import LugaresFisicosPage from "./pages/produccion/LugaresFisicosPage";
import PlanRodajePage from "./pages/produccion/PlanRodajePage";
import PresupuestoICAA from "./pages/produccion/PresupuestoICAA";
import ExportExcelPage from "./pages/produccion/ExportExcelPage";
import MemoriaProduccionPage from "./pages/produccion/MemoriaProduccionPage";
import ExportDossierPage from "./pages/produccion/ExportDossierPage";

// Financiacion Pages
import ConfiguracionPage from "./pages/financiacion/ConfiguracionPage";
import IntensidadPage from "./pages/financiacion/IntensidadPage";
import TerritoriosPage from "./pages/financiacion/TerritoriosPage";
import FuentesPage from "./pages/financiacion/FuentesPage";
import SimuladorPage from "./pages/financiacion/SimuladorPage";
import TimelinePage from "./pages/financiacion/TimelinePage";
import ResumenPage from "./pages/financiacion/ResumenPage";

// Audiencias Pages
import AnalisisAudienciasPage from "./pages/audiencias/AnalisisAudienciasPage";
import AudienciasPage from "./pages/audiencias/AudienciasPage";
import BuyerPersonasPage from "./pages/audiencias/BuyerPersonasPage";
import FestivalesPage from "./pages/audiencias/FestivalesPage";
import DistribucionPage from "./pages/audiencias/DistribucionPage";
import ComunicacionPage from "./pages/audiencias/ComunicacionPage";

// Convocatorias Pages
import BibliotecaPage from "./pages/convocatorias/BibliotecaPage";
import CalendarioPage from "./pages/convocatorias/CalendarioPage";
import WorkspacePage from "./pages/convocatorias/WorkspacePage";
import TareasPage from "./pages/convocatorias/TareasPage";

import GlobalSearch from "./components/GlobalSearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fractal-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalSearch />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/proyectos" element={<ProtectedRoute><Proyectos /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/analisis" element={<ProtectedRoute><Analisis /></ProtectedRoute>} />
              
              {/* Dashboard */}
              <Route path="/proyecto/:projectId/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/configuracion" element={<ProtectedRoute><ProyectoConfiguracionPage /></ProtectedRoute>} />

              {/* Proyecto (Creative) - with projectId */}
              <Route path="/proyecto/:projectId/overview" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/narrativo" element={<ProtectedRoute><NarrativoPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/personajes" element={<ProtectedRoute><PersonajesPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/ventajas" element={<ProtectedRoute><VentajasPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/viabilidad" element={<ProtectedRoute><ViabilidadPage /></ProtectedRoute>} />
              <Route path="/proyecto/:projectId/moodboard" element={<ProtectedRoute><MoodBoardPage /></ProtectedRoute>} />
              
              {/* Produccion - with projectId */}
              <Route path="/produccion/:projectId/desglose" element={<ProtectedRoute><DesglosePage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/personajes" element={<ProtectedRoute><DesglosePersonajesPage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/localizaciones" element={<ProtectedRoute><DesgloseLocalizacionesPage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/lugares" element={<ProtectedRoute><LugaresFisicosPage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/rodaje" element={<ProtectedRoute><PlanRodajePage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/presupuesto" element={<ProtectedRoute><PresupuestoICAA /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/export" element={<ProtectedRoute><ExportExcelPage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/memoria" element={<ProtectedRoute><MemoriaProduccionPage /></ProtectedRoute>} />
              <Route path="/produccion/:projectId/dossier" element={<ProtectedRoute><ExportDossierPage /></ProtectedRoute>} />
              
              {/* Financiacion - with projectId */}
              <Route path="/financiacion/:projectId/resumen" element={<ProtectedRoute><ResumenPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/intensidad" element={<ProtectedRoute><IntensidadPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/territorios" element={<ProtectedRoute><TerritoriosPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/fuentes" element={<ProtectedRoute><FuentesPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/simulador" element={<ProtectedRoute><SimuladorPage /></ProtectedRoute>} />
              <Route path="/financiacion/:projectId/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
              
              {/* Audiencias - with projectId */}
              <Route path="/audiencias/:projectId" element={<Navigate to="analisis" replace />} />
              <Route path="/audiencias/:projectId/analisis" element={<ProtectedRoute><AnalisisAudienciasPage /></ProtectedRoute>} />
              <Route path="/audiencias/:projectId/segmentos" element={<ProtectedRoute><AudienciasPage /></ProtectedRoute>} />
              <Route path="/audiencias/:projectId/buyer-personas" element={<ProtectedRoute><BuyerPersonasPage /></ProtectedRoute>} />
              <Route path="/audiencias/:projectId/festivales" element={<ProtectedRoute><FestivalesPage /></ProtectedRoute>} />
              <Route path="/audiencias/:projectId/distribucion" element={<ProtectedRoute><DistribucionPage /></ProtectedRoute>} />
              <Route path="/audiencias/:projectId/comunicacion" element={<ProtectedRoute><ComunicacionPage /></ProtectedRoute>} />

              {/* Convocatorias - with projectId */}
              <Route path="/convocatorias/:projectId" element={<Navigate to="biblioteca" replace />} />
              <Route path="/convocatorias/:projectId/biblioteca" element={<ProtectedRoute><BibliotecaPage /></ProtectedRoute>} />
              <Route path="/convocatorias/:projectId/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />
              <Route path="/convocatorias/:projectId/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
              <Route path="/convocatorias/:projectId/tareas" element={<ProtectedRoute><TareasPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
