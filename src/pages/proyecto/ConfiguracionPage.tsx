import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Trash2, Cpu, Users, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProject';
import CreativeLayout from '@/components/layout/CreativeLayout';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function ConfiguracionPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [logline, setLogline] = useState('');
  const [projectType, setProjectType] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (project && !initialized) {
    setTitle(project.title || '');
    setLogline(project.logline || '');
    setProjectType(project.project_type || '');
    setInitialized(true);
  }

  const handleSave = () => {
    if (!projectId) return;
    updateProject.mutate(
      { id: projectId, data: { title, logline, project_type: projectType } },
      { onSuccess: () => toast({ title: 'Proyecto actualizado' }) },
    );
  };

  const handleDelete = () => {
    if (!projectId) return;
    deleteProject.mutate(projectId, {
      onSuccess: () => navigate('/proyectos'),
    });
  };

  return (
    <CreativeLayout projectTitle={project?.title}>
      <PageHeader title="Configuración" description="Ajustes del proyecto" />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Datos del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Settings className="w-5 h-5" />Datos del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sinopsis / Logline</Label>
                <Textarea value={logline} onChange={(e) => setLogline(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de proyecto</Label>
                <Input value={projectType} onChange={(e) => setProjectType(e.target.value)} placeholder="Largometraje, cortometraje, serie..." />
              </div>
              <Button onClick={handleSave} disabled={updateProject.isPending}>
                <Save className="w-4 h-4 mr-2" />{updateProject.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardContent>
          </Card>

          {/* Equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5" />Equipo</CardTitle>
              <CardDescription>Gestión de miembros del equipo (próximamente)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">La gestión colaborativa estará disponible en una futura actualización.</p>
            </CardContent>
          </Card>

          {/* Integraciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Cpu className="w-5 h-5" />Integraciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">IA Generativa</p>
                  <p className="text-xs text-muted-foreground">Análisis de guión, generación de contenido</p>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">Activa</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Peligro */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive"><Trash2 className="w-5 h-5" />Zona de Peligro</CardTitle>
              <CardDescription>Estas acciones son irreversibles</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Eliminar Proyecto</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar "{project?.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente el proyecto y todos sus datos asociados. No se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sí, eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}
    </CreativeLayout>
  );
}
