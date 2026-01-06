import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CreativeLayoutProps {
  children: ReactNode;
  projectTitle?: string;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

const creativeTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/proyecto/overview' },
  { id: 'narrativo', label: 'Análisis Narrativo', icon: BookOpen, path: '/proyecto/narrativo' },
  { id: 'personajes', label: 'Personajes', icon: Users, path: '/proyecto/personajes' },
  { id: 'ventajas', label: 'Ventajas/Desventajas', icon: Scale, path: '/proyecto/ventajas' },
  { id: 'viabilidad', label: 'Viabilidad', icon: Gauge, path: '/proyecto/viabilidad' },
  { id: 'moodboard', label: 'Mood Board', icon: Palette, path: '/proyecto/moodboard' },
];

export default function CreativeLayout({ 
  children, 
  projectTitle = 'Mi Proyecto',
  lastSaved,
  isSaving 
}: CreativeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const currentTab = creativeTabs.find(tab => location.pathname.includes(tab.id)) || creativeTabs[0];

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
              <Button variant="ghost" size="sm" onClick={() => navigate('/upload')}>
                ← Proyectos
              </Button>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <h1 className="font-semibold text-lg">{projectTitle}</h1>
              <Badge variant="outline" className="ml-2">Parte Creativa</Badge>
            </div>

            <div className="flex items-center gap-4">
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
                <span className="text-sm text-muted-foreground">
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
            {creativeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname.includes(tab.id);
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(tab.path, { state: location.state })}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap',
                    isActive && 'bg-primary/10 text-primary'
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
