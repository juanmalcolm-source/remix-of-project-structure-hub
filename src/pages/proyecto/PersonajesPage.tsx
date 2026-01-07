import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState, EmptyState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateCharacter, useCreateCharacter, useDeleteCharacter, Character } from '@/hooks/useProject';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['Principal', 'Secundario', 'Episódico', 'Figurante'];

export default function PersonajesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error } = useProject(projectId);
  const updateCharacter = useUpdateCharacter();
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Principal', dramatic_arc: '', shooting_days: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setFormData({ name: character.name || '', description: character.description || '', category: character.category || 'Principal', dramatic_arc: character.dramatic_arc || '', shooting_days: character.shooting_days || 0 });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingCharacter(null);
    setFormData({ name: '', description: '', category: 'Principal', dramatic_arc: '', shooting_days: 0 });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!projectId || !formData.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingCharacter) {
        await updateCharacter.mutateAsync({ id: editingCharacter.id, projectId, data: formData });
      } else {
        await createCharacter.mutateAsync({ projectId, data: formData });
      }
      setLastSaved(new Date());
      setIsDialogOpen(false);
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch { toast({ title: 'Error al guardar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (character: Character) => {
    if (!projectId) return;
    try { await deleteCharacter.mutateAsync({ id: character.id, projectId }); toast({ title: 'Personaje eliminado' }); }
    catch { toast({ title: 'Error al eliminar', variant: 'destructive' }); }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'principal': return 'bg-primary text-primary-foreground';
      case 'secundario': return 'bg-blue-500 text-white';
      case 'episódico': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) return <CreativeLayout projectTitle="Cargando..."><PageSkeleton variant="cards" /></CreativeLayout>;
  if (error || !project) return <CreativeLayout projectTitle="Error"><ErrorState message="No se pudo cargar el proyecto" /></CreativeLayout>;

  const characters = project.characters || [];

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Users className="w-6 h-6" /><div><h2 className="text-2xl font-bold">Personajes</h2><p className="text-muted-foreground">{characters.length} personajes en el proyecto</p></div></div>
          <Button onClick={openNewDialog}><Plus className="w-4 h-4 mr-2" />Añadir Personaje</Button>
        </div>

        {characters.length === 0 ? <EmptyState icon="👤" title="Sin personajes" description="Aún no hay personajes. Añade el primero o analiza un guión." /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <Card key={character.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEditDialog(character)}>
                <CardHeader className="pb-2"><div className="flex items-start justify-between"><CardTitle className="text-lg">{character.name}</CardTitle><Badge className={getCategoryColor(character.category || '')}>{character.category || 'Sin categoría'}</Badge></div></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{character.description || 'Sin descripción'}</p>
                  {character.dramatic_arc && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="w-3 h-3" /><span className="line-clamp-1">{character.dramatic_arc}</span></div>}
                  {character.shooting_days && character.shooting_days > 0 && <p className="text-xs text-muted-foreground mt-2">📅 {character.shooting_days} días de rodaje</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCharacter ? 'Editar Personaje' : 'Nuevo Personaje'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del personaje" /></div>
            <div><Label>Categoría</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Descripción</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción del personaje..." rows={3} /></div>
            <div><Label>Arco Dramático</Label><Textarea value={formData.dramatic_arc} onChange={(e) => setFormData({ ...formData, dramatic_arc: e.target.value })} placeholder="Evolución del personaje..." rows={2} /></div>
            <div><Label>Días de Rodaje Estimados</Label><Input type="number" value={formData.shooting_days} onChange={(e) => setFormData({ ...formData, shooting_days: parseInt(e.target.value) || 0 })} min={0} /></div>
            <div className="flex justify-between pt-4">
              {editingCharacter && <Button variant="destructive" onClick={() => { handleDelete(editingCharacter); setIsDialogOpen(false); }}>Eliminar</Button>}
              <div className="flex gap-2 ml-auto"><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>{isSaving ? 'Guardando...' : 'Guardar'}</Button></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CreativeLayout>
  );
}
