import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Users, Sparkles, ChevronDown, ChevronUp, User, Swords, Heart, Ghost, Flame, Shield } from 'lucide-react';
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name || '',
      description: character.description || '',
      category: character.category || 'Principal',
      dramatic_arc: character.dramatic_arc || '',
      shooting_days: character.shooting_days || 0,
    });
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
      case 'protagonista': return 'bg-yellow-500 text-black';
      case 'principal': return 'bg-primary text-primary-foreground';
      case 'secundario': return 'bg-blue-500 text-white';
      case 'episódico': return 'bg-amber-500 text-white';
      case 'figuracion': case 'figurante': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImportanciaColor = (imp: string | null) => {
    switch (imp) {
      case 'Alta': return 'text-red-600';
      case 'Media': return 'text-amber-600';
      case 'Baja': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) return <CreativeLayout projectTitle="Cargando..."><PageSkeleton variant="cards" /></CreativeLayout>;
  if (error || !project) return <CreativeLayout projectTitle="Error"><ErrorState message="No se pudo cargar el proyecto" /></CreativeLayout>;

  const characters = project.characters || [];

  // Determine if any character has deep analysis fields
  const hasDeepFields = characters.some(c =>
    c.motivaciones || c.conflictos || c.necesidad_dramatica || c.flaw_principal ||
    c.transformacion || c.ghost || c.stakes || c.funcion_narrativa
  );

  return (
    <CreativeLayout projectTitle={project.title} lastSaved={lastSaved} isSaving={isSaving}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Personajes</h2>
              <p className="text-muted-foreground">
                {characters.length} personajes en el proyecto
                {hasDeepFields && (
                  <Badge variant="outline" className="ml-2 text-xs">Análisis Profundo</Badge>
                )}
              </p>
            </div>
          </div>
          <Button onClick={openNewDialog}><Plus className="w-4 h-4 mr-2" />Añadir Personaje</Button>
        </div>

        {characters.length === 0 ? (
          <EmptyState icon="👤" title="Sin personajes" description="Aún no hay personajes. Añade el primero o analiza un guión." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => {
              const isExpanded = expandedCards[character.id];
              const hasDeep = character.motivaciones || character.conflictos ||
                character.necesidad_dramatica || character.flaw_principal ||
                character.transformacion || character.ghost || character.stakes ||
                character.funcion_narrativa;

              return (
                <Card key={character.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="cursor-pointer" onClick={() => openEditDialog(character)}>
                        <CardTitle className="text-lg">{character.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {character.genero && (
                            <span className="text-xs text-muted-foreground">{character.genero}</span>
                          )}
                          {character.edad_aproximada && (
                            <span className="text-xs text-muted-foreground">{character.edad_aproximada}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={getCategoryColor(character.category || '')}>
                          {character.category || 'Sin categoría'}
                        </Badge>
                        {character.importancia_trama && (
                          <Badge variant="outline" className={`text-xs ${getImportanciaColor(character.importancia_trama)}`}>
                            {character.importancia_trama}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {character.description || 'Sin descripción'}
                    </p>

                    {character.dramatic_arc && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span className="line-clamp-1">{character.dramatic_arc}</span>
                      </div>
                    )}

                    {character.funcion_narrativa && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <User className="w-3 h-3" />
                        <span>{character.funcion_narrativa}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {character.shooting_days && character.shooting_days > 0 && (
                        <span className="text-xs text-muted-foreground">{character.shooting_days} días rodaje</span>
                      )}
                      {character.escenas_aparicion && Array.isArray(character.escenas_aparicion) && (
                        <span className="text-xs text-muted-foreground">
                          {(character.escenas_aparicion as unknown[]).length} escenas
                        </span>
                      )}
                    </div>

                    {/* Deep analysis toggle */}
                    {hasDeep && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={(e) => toggleCard(character.id, e)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Análisis profundo</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 text-xs">
                            {character.motivaciones && (
                              <div className="flex items-start gap-2">
                                <Heart className="w-3 h-3 mt-0.5 text-red-400 shrink-0" />
                                <div><strong>Motivaciones:</strong> {character.motivaciones}</div>
                              </div>
                            )}
                            {character.necesidad_dramatica && (
                              <div className="flex items-start gap-2">
                                <Flame className="w-3 h-3 mt-0.5 text-orange-400 shrink-0" />
                                <div><strong>Necesidad dramática:</strong> {character.necesidad_dramatica}</div>
                              </div>
                            )}
                            {character.conflictos && (
                              <div className="flex items-start gap-2">
                                <Swords className="w-3 h-3 mt-0.5 text-red-500 shrink-0" />
                                <div><strong>Conflictos:</strong> {character.conflictos}</div>
                              </div>
                            )}
                            {character.flaw_principal && (
                              <div className="flex items-start gap-2">
                                <Shield className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                                <div><strong>Flaw principal:</strong> {character.flaw_principal}</div>
                              </div>
                            )}
                            {character.ghost && (
                              <div className="flex items-start gap-2">
                                <Ghost className="w-3 h-3 mt-0.5 text-purple-400 shrink-0" />
                                <div><strong>Ghost:</strong> {character.ghost}</div>
                              </div>
                            )}
                            {character.transformacion && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-3 h-3 mt-0.5 text-green-400 shrink-0" />
                                <div><strong>Transformación:</strong> {character.transformacion}</div>
                              </div>
                            )}
                            {character.stakes && (
                              <div className="flex items-start gap-2">
                                <Flame className="w-3 h-3 mt-0.5 text-red-600 shrink-0" />
                                <div><strong>Stakes:</strong> {character.stakes}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCharacter ? 'Editar Personaje' : 'Nuevo Personaje'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del personaje" /></div>
            <div><Label>Categoría</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
