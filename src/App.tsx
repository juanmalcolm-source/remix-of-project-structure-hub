import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eagerly loaded (critical path)
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GlobalSearch from "./components/GlobalSearch";

// Lazy loaded pages
const Upload = lazy(() => import("./pages/Upload"));
const Proyectos = lazy(() => import("./pages/Proyectos"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Analisis = lazy(() => import("./pages/Analisis"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// Proyecto (Creative)
const OverviewPage = lazy(() => import("./pages/proyecto/OverviewPage"));
const NarrativoPage = lazy(() => import("./pages/proyecto/NarrativoPage"));
const PersonajesPage = lazy(() => import("./pages/proyecto/PersonajesPage"));
const VentajasPage = lazy(() => import("./pages/proyecto/VentajasPage"));
const ViabilidadPage = lazy(() => import("./pages/proyecto/ViabilidadPage"));
const MoodBoardPage = lazy(() => import("./pages/proyecto/MoodBoardPage"));
const ProyectoConfiguracionPage = lazy(() => import("./pages/proyecto/ConfiguracionPage"));

// Produccion
const DesglosePage = lazy(() => import("./pages/produccion/DesglosePage"));
const DesglosePersonajesPage = lazy(() => import("./pages/produccion/DesglosePersonajesPage"));
const DesgloseLocalizacionesPage = lazy(() => import("./pages/produccion/DesgloseLocalizacionesPage"));
const LugaresFisicosPage = lazy(() => import("./pages/produccion/LugaresFisicosPage"));
const PlanRodajePage = lazy(() => import("./pages/produccion/PlanRodajePage"));
const PresupuestoICAA = lazy(() => import("./pages/produccion/PresupuestoICAA"));
const ExportExcelPage = lazy(() => import("./pages/produccion/ExportExcelPage"));
const MemoriaProduccionPage = lazy(() => import("./pages/produccion/MemoriaProduccionPage"));
const ExportDossierPage = lazy(() => import("./pages/produccion/ExportDossierPage"));

// Financiacion
const ConfiguracionPage = lazy(() => import("./pages/financiacion/ConfiguracionPage"));
const IntensidadPage = lazy(() => import("./pages/financiacion/IntensidadPage"));
const TerritoriosPage = lazy(() => import("./pages/financiacion/TerritoriosPage"));
const FuentesPage = lazy(() => import("./pages/financiacion/FuentesPage"));
const SimuladorPage = lazy(() => import("./pages/financiacion/SimuladorPage"));
const TimelinePage = lazy(() => import("./pages/financiacion/TimelinePage"));
const ResumenPage = lazy(() => import("./pages/financiacion/ResumenPage"));

// Audiencias
const AnalisisAudienciasPage = lazy(() => import("./pages/audiencias/AnalisisAudienciasPage"));
const AudienciasPage = lazy(() => import("./pages/audiencias/AudienciasPage"));
const BuyerPersonasPage = lazy(() => import("./pages/audiencias/BuyerPersonasPage"));
const FestivalesPage = lazy(() => import("./pages/audiencias/FestivalesPage"));
const DistribucionPage = lazy(() => import("./pages/audiencias/DistribucionPage"));
const ComunicacionPage = lazy(() => import("./pages/audiencias/ComunicacionPage"));

// Convocatorias
const BibliotecaPage = lazy(() => import("./pages/convocatorias/BibliotecaPage"));
const CalendarioPage = lazy(() => import("./pages/convocatorias/CalendarioPage"));
const WorkspacePage = lazy(() => import("./pages/convocatorias/WorkspacePage"));
const TareasPage = lazy(() => import("./pages/convocatorias/TareasPage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fractal-theme">
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GlobalSearch />
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
