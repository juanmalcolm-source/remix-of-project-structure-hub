import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, 
  Edit2, 
  Plus,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface Character {
  id: string;
  name: string;
  category: 'protagonista' | 'principal' | 'secundario' | 'figuracion';
  description: string;
  dramaticArc: string;
  castingSuggestions: string[];
  shootingDays: number;
  relationships: string[];
}

export default function PersonajesPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [characters, setCharacters] = useState<Character[]>(
    analisis?.personajes.map((p, i) => ({
      id: `char-${i}`,
      name: p.nombre,
      category: p.categoria as Character['category'],
      description: p.descripcion,
      dramaticArc: 'Arco de transformación del personaje',
      castingSuggestions: [],
      shootingDays: p.dias_rodaje_estimados,
      relationships: [],
    })) || [
      {
        id: 'char-1',
        name: 'Protagonista',
        category: 'protagonista',
        description: 'El personaje principal de la historia',
        dramaticArc: 'De la duda a la determinación',
        castingSuggestions: ['Actor A', 'Actor B'],
        shootingDays: 20,
        relationships: ['Antagonista', 'Mentor'],
      }
    ]
  );

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCasting, setIsGeneratingCasting] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const updateCharacter = (id: string, field: keyof Character, value: any) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, [field]: value } : char
    ));
  };

  const handleGenerateCasting = async (id: string) => {
    setIsGeneratingCasting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate AI suggestions
    updateCharacter(id, 'castingSuggestions', [
      'Javier Bardem',
      'Penélope Cruz',
      'Antonio Banderas'
    ]);
    
    toast({ title: 'Propuestas de casting generadas con IA' });
    setIsGeneratingCasting(false);
  };

  const addCharacter = () => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: 'Nuevo Personaje',
      category: 'secundario',
      description: 'Descripción del personaje',
      dramaticArc: 'Arco dramático',
      castingSuggestions: [],
      shootingDays: 5,
      relationships: [],
    };
    setCharacters(prev => [...prev, newChar]);
  };

  const deleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
    toast({ title: 'Personaje eliminado' });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'protagonista': return 'bg-primary/20 text-primary';
      case 'principal': return 'bg-blue-500/20 text-blue-700';
      case 'secundario': return 'bg-yellow-500/20 text-yellow-700';
      case 'figuracion': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <CreativeLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Personajes</h2>
            <p className="text-muted-foreground">{characters.length} personajes en el proyecto</p>
          </div>
          <Button onClick={addCharacter}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir personaje
          </Button>
        </div>

        {/* Character Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => (
            <Card key={char.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingField?.id === char.id && editingField.field === 'name' ? (
                      <Input
                        value={char.name}
                        onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                        onBlur={() => { setEditingField(null); handleSave(); }}
                        autoFocus
                        className="font-semibold text-lg"
                      />
                    ) : (
                      <CardTitle 
                        className="cursor-pointer hover:text-primary flex items-center gap-2"
                        onClick={() => setEditingField({ id: char.id, field: 'name' })}
                      >
                        {char.name}
                        <Edit2 className="w-3 h-3 opacity-50" />
                      </CardTitle>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getCategoryColor(char.category)}>
                        {char.category}
                      </Badge>
                      <Badge variant="outline">{char.shootingDays} días</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setExpandedCard(expandedCard === char.id ? null : char.id)}
                    >
                      {expandedCard === char.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteCharacter(char.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <div>
                  <label className="text-xs text-muted-foreground">Descripción</label>
                  {editingField?.id === char.id && editingField.field === 'description' ? (
                    <Textarea
                      value={char.description}
                      onChange={(e) => updateCharacter(char.id, 'description', e.target.value)}
                      onBlur={() => { setEditingField(null); handleSave(); }}
                      autoFocus
                      rows={2}
                    />
                  ) : (
                    <p 
                      className="text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                      onClick={() => setEditingField({ id: char.id, field: 'description' })}
                    >
                      {char.description}
                    </p>
                  )}
                </div>

                {/* Expanded content */}
                {expandedCard === char.id && (
                  <>
                    {/* Category selector */}
                    <div>
                      <label className="text-xs text-muted-foreground">Categoría</label>
                      <Select 
                        value={char.category}
                        onValueChange={(value) => {
                          updateCharacter(char.id, 'category', value);
                          handleSave();
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="protagonista">Protagonista</SelectItem>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="secundario">Secundario</SelectItem>
                          <SelectItem value="figuracion">Figuración</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dramatic Arc */}
                    <div>
                      <label className="text-xs text-muted-foreground">Arco Dramático</label>
                      {editingField?.id === char.id && editingField.field === 'arc' ? (
                        <Textarea
                          value={char.dramaticArc}
                          onChange={(e) => updateCharacter(char.id, 'dramaticArc', e.target.value)}
                          onBlur={() => { setEditingField(null); handleSave(); }}
                          autoFocus
                          rows={2}
                        />
                      ) : (
                        <p 
                          className="text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                          onClick={() => setEditingField({ id: char.id, field: 'arc' })}
                        >
                          {char.dramaticArc}
                        </p>
                      )}
                    </div>

                    {/* Casting Suggestions */}
                    <div>
                      <label className="text-xs text-muted-foreground">Propuestas de Casting</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {char.castingSuggestions.map((actor, i) => (
                          <Badge key={i} variant="secondary">{actor}</Badge>
                        ))}
                        {char.castingSuggestions.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sin propuestas</span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleGenerateCasting(char.id)}
                        disabled={isGeneratingCasting}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGeneratingCasting ? 'Generando...' : 'Generar con IA'}
                      </Button>
                    </div>

                    {/* Shooting days */}
                    <div>
                      <label className="text-xs text-muted-foreground">Días de Rodaje</label>
                      <Input
                        type="number"
                        value={char.shootingDays}
                        onChange={(e) => updateCharacter(char.id, 'shootingDays', parseInt(e.target.value) || 0)}
                        onBlur={handleSave}
                        className="w-24"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Character Relationships Map (placeholder) */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mapa de Relaciones
              <Badge variant="secondary">Próximamente</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Visualización del mapa de relaciones entre personajes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreativeLayout>
  );
}
