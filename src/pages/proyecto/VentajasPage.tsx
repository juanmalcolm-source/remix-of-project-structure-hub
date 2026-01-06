import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Scale, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb,
  Lock,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ListItem {
  id: string;
  text: string;
}

export default function VentajasPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [strengths, setStrengths] = useState<ListItem[]>([
    { id: '1', text: 'Historia original con elementos únicos' },
    { id: '2', text: 'Personajes con arcos bien definidos' },
    { id: '3', text: 'Diálogos naturales y creíbles' },
  ]);

  const [weaknesses, setWeaknesses] = useState<ListItem[]>([
    { id: '1', text: 'Segundo acto algo lento' },
    { id: '2', text: 'Demasiadas localizaciones exteriores' },
  ]);

  const [suggestions, setSuggestions] = useState<ListItem[]>([
    { id: '1', text: 'Condensar escenas del segundo acto' },
    { id: '2', text: 'Considerar filmar exteriores en una misma zona' },
  ]);

  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [editingItem, setEditingItem] = useState<{ list: string; id: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const addItem = (list: 'strengths' | 'weaknesses' | 'suggestions') => {
    const newItem = { id: `${Date.now()}`, text: 'Nuevo elemento' };
    switch (list) {
      case 'strengths':
        setStrengths(prev => [...prev, newItem]);
        break;
      case 'weaknesses':
        setWeaknesses(prev => [...prev, newItem]);
        break;
      case 'suggestions':
        setSuggestions(prev => [...prev, newItem]);
        break;
    }
    setEditingItem({ list, id: newItem.id });
  };

  const updateItem = (list: 'strengths' | 'weaknesses' | 'suggestions', id: string, text: string) => {
    const update = (items: ListItem[]) => 
      items.map(item => item.id === id ? { ...item, text } : item);
    
    switch (list) {
      case 'strengths':
        setStrengths(update);
        break;
      case 'weaknesses':
        setWeaknesses(update);
        break;
      case 'suggestions':
        setSuggestions(update);
        break;
    }
  };

  const deleteItem = (list: 'strengths' | 'weaknesses' | 'suggestions', id: string) => {
    const filter = (items: ListItem[]) => items.filter(item => item.id !== id);
    
    switch (list) {
      case 'strengths':
        setStrengths(filter);
        break;
      case 'weaknesses':
        setWeaknesses(filter);
        break;
      case 'suggestions':
        setSuggestions(filter);
        break;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate AI generation
    setStrengths([
      { id: '1', text: 'Conflicto central potente y universal' },
      { id: '2', text: 'Protagonista con motivaciones claras' },
      { id: '3', text: 'Estructura narrativa sólida' },
    ]);
    
    setWeaknesses([
      { id: '1', text: 'El antagonista necesita más desarrollo' },
      { id: '2', text: 'Algunas transiciones abruptas' },
    ]);
    
    setSuggestions([
      { id: '1', text: 'Añadir escena que humanice al antagonista' },
      { id: '2', text: 'Suavizar transiciones con escenas puente' },
    ]);
    
    toast({ title: 'Análisis regenerado con IA' });
    setIsGenerating(false);
  };

  const renderList = (
    items: ListItem[], 
    listName: 'strengths' | 'weaknesses' | 'suggestions',
    icon: React.ReactNode,
    iconColor: string
  ) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div 
          key={item.id}
          className="flex items-start gap-2 group"
        >
          <span className={`mt-1 ${iconColor}`}>{icon}</span>
          {editingItem?.list === listName && editingItem.id === item.id ? (
            <Textarea
              value={item.text}
              onChange={(e) => updateItem(listName, item.id, e.target.value)}
              onBlur={() => { setEditingItem(null); handleSave(); }}
              autoFocus
              rows={2}
              className="flex-1"
            />
          ) : (
            <p 
              className="flex-1 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
              onClick={() => setEditingItem({ list: listName, id: item.id })}
            >
              {item.text}
            </p>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteItem(listName, item.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => addItem(listName)}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Añadir
      </Button>
    </div>
  );

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
            <h2 className="text-2xl font-bold">Ventajas y Desventajas</h2>
            <p className="text-muted-foreground">Análisis DAFO del guión</p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Regenerar con IA'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fortalezas */}
          <Card>
            <CardHeader className="bg-green-500/10">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <ThumbsUp className="w-5 h-5" />
                Fortalezas ({strengths.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {renderList(
                strengths, 
                'strengths', 
                <div className="w-2 h-2 rounded-full bg-green-500" />,
                ''
              )}
            </CardContent>
          </Card>

          {/* Debilidades */}
          <Card>
            <CardHeader className="bg-red-500/10">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ThumbsDown className="w-5 h-5" />
                Debilidades ({weaknesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {renderList(
                weaknesses, 
                'weaknesses', 
                <div className="w-2 h-2 rounded-full bg-red-500" />,
                ''
              )}
            </CardContent>
          </Card>

          {/* Propuestas de Mejora */}
          <Card>
            <CardHeader className="bg-yellow-500/10">
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Lightbulb className="w-5 h-5" />
                Propuestas ({suggestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {renderList(
                suggestions, 
                'suggestions', 
                <div className="w-2 h-2 rounded-full bg-yellow-500" />,
                ''
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notas Confidenciales */}
        <Card className="border-2 border-dashed">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-5 h-5" />
              Notas Confidenciales
              <Badge variant="secondary" className="ml-2">No exportable</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Textarea
              placeholder="Escribe aquí notas internas que no quieres incluir en el dossier exportable..."
              value={confidentialNotes}
              onChange={(e) => setConfidentialNotes(e.target.value)}
              onBlur={handleSave}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Esta sección es solo para uso interno y no se incluirá en ningún export.
            </p>
          </CardContent>
        </Card>
      </div>
    </CreativeLayout>
  );
}
