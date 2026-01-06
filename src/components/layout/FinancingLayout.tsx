import { ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Percent, 
  Map, 
  Wallet,
  FlaskConical,
  Calendar,
  LogOut,
  ChevronRight,
  Save,
  Palette,
  Clapperboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FinancingLayoutProps {
  children: ReactNode;
  projectTitle?: string;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function FinancingLayout({ 
  children, 
  projectTitle = 'Mi Proyecto',
  lastSaved,
  isSaving 
}: FinancingLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, profile, signOut } = useAuth();

  const financingTabs = [
    { id: 'configuracion', label: 'Configuración', icon: Settings, path: `/financiacion/${projectId}/configuracion` },
    { id: 'intensidad', label: 'Intensidad Pública', icon: Percent, path: `/financiacion/${projectId}/intensidad` },
    { id: 'territorios', label: 'Comparador Territorios', icon: Map, path: `/financiacion/${projectId}/territorios` },
    { id: 'fuentes', label: 'Fuentes Financiación', icon: Wallet, path: `/financiacion/${projectId}/fuentes` },
    { id: 'simulador', label: 'Simulador "What If"', icon: FlaskConical, path: `/financiacion/${projectId}/simulador` },
    { id: 'timeline', label: 'Timeline Cobros', icon: Calendar, path: `/financiacion/${projectId}/timeline` },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/proyectos')}>
                ← Proyectos
              </Button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <h1 className="font-semibold text-lg">{projectTitle}</h1>
              <Badge variant="default" className="ml-2 bg-green-500/20 text-green-700 border-green-500/30">
                Financiación
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
                  onClick={() => navigate(`/produccion/${projectId}/personajes`)}
                >
                  <Clapperboard className="w-4 h-4 mr-1" />
                  Producción
                </Button>
              </div>

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

          <nav className="flex gap-1 py-2 overflow-x-auto">
            {financingTabs.map((tab) => {
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
                    isActive && 'bg-green-500/10 text-green-700'
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

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
