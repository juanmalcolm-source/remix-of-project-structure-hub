import { ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Calculator,
  FileSpreadsheet,
  FileText,
  LogOut,
  Settings,
  ChevronRight,
  Save,
  Palette,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ProductionLayoutProps {
  children: ReactNode;
  projectTitle?: string;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function ProductionLayout({ 
  children, 
  projectTitle = 'Mi Proyecto',
  lastSaved,
  isSaving 
}: ProductionLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, profile, signOut } = useAuth();

  const productionTabs = [
    { id: 'personajes', label: 'Desglose Personajes', icon: Users, path: `/produccion/${projectId}/personajes` },
    { id: 'localizaciones', label: 'Desglose Localizaciones', icon: MapPin, path: `/produccion/${projectId}/localizaciones` },
    { id: 'rodaje', label: 'Plan de Rodaje', icon: Calendar, path: `/produccion/${projectId}/rodaje` },
    { id: 'presupuesto', label: 'Presupuesto ICAA', icon: Calculator, path: `/produccion/${projectId}/presupuesto` },
    { id: 'memoria', label: 'Memoria', icon: FileText, path: `/produccion/${projectId}/memoria` },
    { id: 'export', label: 'Export Excel', icon: FileSpreadsheet, path: `/produccion/${projectId}/export` },
    { id: 'dossier', label: 'Export Dossier', icon: FileSpreadsheet, path: `/produccion/${projectId}/dossier` },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/proyectos')}>
                ← Proyectos
              </Button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <h1 className="font-semibold text-lg">{projectTitle}</h1>
              <Badge variant="default" className="ml-2 bg-orange-500/20 text-orange-700 border-orange-500/30">
                Producción
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Section Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/proyecto/${projectId}/overview`)}
                >
                  <Palette className="w-4 h-4 mr-1" />
                  Creativa
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/financiacion/${projectId}/configuracion`)}
                >
                  <Wallet className="w-4 h-4 mr-1" />
                  Financiación
                </Button>
              </div>

              {/* Save status */}
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Save className="w-4 h-4 animate-pulse" />
                  Guardando...
                </div>
              )}
              {lastSaved && !isSaving && (
                <div className="text-sm text-muted-foreground">
                  Guardado {lastSaved.toLocaleTimeString()}
                </div>
              )}

              {/* User menu */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {profile?.company_name || user?.email}
                </span>
                <Button variant="ghost" size="icon" onClick={() => navigate('/perfil')}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {productionTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname.includes(tab.id);
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap',
                    isActive && 'bg-orange-500/10 text-orange-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
