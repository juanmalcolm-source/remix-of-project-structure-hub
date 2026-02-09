import { useState, type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Scale, Gauge, Palette,
  LogOut, Settings, Save, Clapperboard, Wallet, Film, Megaphone, Landmark, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
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
  isSaving,
}: CreativeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { user, profile, signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const creativeTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: `/proyecto/${projectId}/overview` },
    { id: 'narrativo', label: 'Análisis Narrativo', icon: BookOpen, path: `/proyecto/${projectId}/narrativo` },
    { id: 'personajes', label: 'Personajes', icon: Users, path: `/proyecto/${projectId}/personajes` },
    { id: 'ventajas', label: 'Ventajas/Desventajas', icon: Scale, path: `/proyecto/${projectId}/ventajas` },
    { id: 'viabilidad', label: 'Viabilidad', icon: Gauge, path: `/proyecto/${projectId}/viabilidad` },
    { id: 'moodboard', label: 'Mood Board', icon: Palette, path: `/proyecto/${projectId}/moodboard` },
  ];

  const sections = [
    { id: 'creativa', label: 'Creativa', icon: Palette, path: `/proyecto/${projectId}/overview`, match: '/proyecto/' },
    { id: 'produccion', label: 'Producción', icon: Clapperboard, path: `/produccion/${projectId}/personajes`, match: '/produccion/' },
    { id: 'financiacion', label: 'Financiación', icon: Wallet, path: `/financiacion/${projectId}/resumen`, match: '/financiacion/' },
    { id: 'audiencias', label: 'Audiencias', icon: Megaphone, path: `/audiencias/${projectId}/analisis`, match: '/audiencias/' },
    { id: 'convocatorias', label: 'Convocatorias', icon: Landmark, path: `/convocatorias/${projectId}/biblioteca`, match: '/convocatorias/' },
  ];

  const navigateTo = (path: string) => { setSheetOpen(false); navigate(path); };
  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const renderSidebarContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Fractal Kit</h1>
            <p className="text-xs text-sidebar-foreground/60">Script Analysis</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-b border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={() => navigateTo('/proyectos')} className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent mb-2 -ml-2">← Proyectos</Button>
        <h2 className="font-display font-semibold text-sidebar-foreground truncate" title={projectTitle}>{projectTitle}</h2>
        <Badge className="mt-2 badge-gold text-xs">Parte Creativa</Badge>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {creativeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.includes(tab.id);
          return (
            <button key={tab.id} onClick={() => navigateTo(tab.path)} className={cn('sidebar-link w-full text-left', isActive && 'sidebar-link-active')}>
              <Icon className="w-4 h-4" /><span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-2">Secciones</p>
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = location.pathname.includes(s.match);
          return (
            <Button key={s.id} variant="ghost" size="sm" onClick={() => navigateTo(s.path)} className={cn('w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent', isActive && 'bg-accent text-accent-foreground')}>
              <Icon className="w-4 h-4 mr-2" />{s.label}
            </Button>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-sm font-medium">{(profile?.company_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</div>
          <div className="flex-1 min-w-0"><p className="text-sm text-sidebar-foreground truncate">{profile?.company_name || user?.email?.split('@')[0]}</p></div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigateTo('/perfil')} className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"><Settings className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"><LogOut className="w-4 h-4" /></Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 hidden lg:flex flex-col">
        {renderSidebarContent()}
      </aside>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <div className="flex flex-col h-full">{renderSidebarContent()}</div>
        </SheetContent>
      </Sheet>

      <header className="lg:hidden border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSheetOpen(true)}><Menu className="w-5 h-5" /></Button>
            <span className="font-display font-semibold">{projectTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Save className="w-4 h-4 animate-pulse text-muted-foreground" />}
            <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="lg:ml-64">
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b bg-card/50">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink className="cursor-pointer" onClick={() => navigate('/proyectos')}>Proyectos</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{projectTitle}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-4">
            {isSaving && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Save className="w-4 h-4 animate-pulse" />Guardando...</div>}
            {lastSaved && !isSaving && <div className="text-sm text-muted-foreground">Guardado {lastSaved.toLocaleTimeString()}</div>}
          </div>
        </div>
        <div className="p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">{children}</div>
      </main>
    </div>
  );
}
