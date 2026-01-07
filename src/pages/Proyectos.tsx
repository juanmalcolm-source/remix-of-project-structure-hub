import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Film, 
  Calendar,
  MoreVertical,
  Trash2,
  FolderOpen,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects, useDeleteProject } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';

export default function Proyectos() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProject.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'analyzed': return 'bg-blue-500/20 text-blue-700';
      case 'in_production': return 'bg-amber-500/20 text-amber-700';
      case 'completed': return 'badge-gold';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'analyzed': return 'Analizado';
      case 'in_production': return 'En producción';
      case 'completed': return 'Completado';
      default: return 'Borrador';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Film className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl">Fractal Kit</h1>
                <p className="text-sm text-muted-foreground">Gestión de proyectos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Mis Proyectos</h2>
            <p className="text-muted-foreground mt-1">
              {projects?.length || 0} proyecto{projects?.length !== 1 ? 's' : ''} en desarrollo
            </p>
          </div>
          <Button onClick={() => navigate('/upload')} className="btn-gold">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card-cinematic">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <Card className="card-cinematic text-center py-16">
            <CardContent>
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <FolderOpen className="w-10 h-10 text-accent" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">No hay proyectos</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Sube tu primer guión para comenzar el análisis automático con IA
              </p>
              <Button onClick={() => navigate('/upload')} className="btn-gold">
                <Sparkles className="w-4 h-4 mr-2" />
                Crear Mi Primer Proyecto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project, index) => (
              <Card 
                key={project.id} 
                className="card-cinematic cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/proyecto/${project.id}/overview`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="font-display line-clamp-1 group-hover:text-accent transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                        {project.project_type && (
                          <Badge variant="outline" className="capitalize">
                            {project.project_type}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/proyecto/${project.id}/overview`); }}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Abrir
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.logline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.logline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Actualizado {new Date(project.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos del proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}