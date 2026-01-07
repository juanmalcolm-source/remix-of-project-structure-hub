import { ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Scale, 
  Gauge, 
  Palette,
  LogOut,
  Settings,
  ChevronRight,
  Save,
  Clapperboard,
  Wallet,
  Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';

interface CreativeLayoutProps {
  children: ReactNode;
  projectTitle?: string;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export default function CreativeLayout({ 
  children, 
  projectTitle = 'Mi Proyecto',
  lastSaved,
  isSaving 
}: CreativeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, profile, signOut } = useAuth();

  const creativeTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: `/proyecto/${projectId}/overview` },
    { id: 'narrativo', label: 'Análisis Narrativo', icon: BookOpen, path: `/proyecto/${projectId}/narrativo` },
    { id: 'personajes', label: 'Personajes', icon: Users, path: `/proyecto/${projectId}/personajes` },
    { id: 'ventajas', label: 'Ventajas/Desventajas', icon: Scale, path: `/proyecto/${projectId}/ventajas` },
    { id: 'viabilidad', label: 'Viabilidad', icon: Gauge, path: `/proyecto/${projectId}/viabilidad` },
    { id: 'moodboard', label: 'Mood Board', icon: Palette, path: `/proyecto/${projectId}/moodboard` },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Film className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sidebar-foreground text-lg">Fractal Kit</h1>
              <p className="text-xs text-sidebar-foreground/60">Script Analysis</p>
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/proyectos')}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent mb-2 -ml-2"
          >
            ← Proyectos
          </Button>
          <h2 className="font-display font-semibold text-sidebar-foreground truncate" title={projectTitle}>
            {projectTitle}
          </h2>
          <Badge className="mt-2 badge-gold text-xs">Parte Creativa</Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {creativeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.includes(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'sidebar-link w-full text-left',
                  isActive && 'sidebar-link-active'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Section Switcher */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-2">Secciones</p>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/produccion/${projectId}/personajes`)}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Clapperboard className="w-4 h-4 mr-2" />
            Producción
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/financiacion/${projectId}/configuracion`)}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Financiación
          </Button>
        </div>

        {/* User */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm font-medium">
              {(profile?.company_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground truncate">
                {profile?.company_name || user?.email?.split('@')[0]}
              </p>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate('/perfil')} className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            <span className="font-display font-semibold">{projectTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Save className="w-4 h-4 animate-pulse text-muted-foreground" />}
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
          {creativeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.includes(tab.id);
            return (
              <Button
                key={tab.id}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(tab.path)}
                className={cn('flex items-center gap-2 whitespace-nowrap', isActive && 'bg-accent/15 text-accent')}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b bg-card/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Proyectos</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{projectTitle}</span>
          </div>
          <div className="flex items-center gap-4">
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
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}