import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject, useUpdateCreativeAnalysis } from '@/hooks/useProject';
import { Json } from '@/integrations/supabase/types';

interface ListItem {
  id: string;
  text: string;
}

function parseToListItems(data: Json | null | undefined): ListItem[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      id: `${index}`,
      text: typeof item === 'string' ? item : JSON.stringify(item),
    }));
  }
  return [];
}

function listItemsToStrings(items: ListItem[]): string[] {
  return items.map(item => item.text);
}

export default function VentajasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error } = useProject(projectId);
  const updateAnalysis = useUpdateCreativeAnalysis();

  const [strengths, setStrengths] = useState<ListItem[]>([]);
  const [weaknesses, setWeaknesses] = useState<ListItem[]>([]);
  const [suggestions, setSuggestions] = useState<ListItem[]>([]);
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [editingItem, setEditingItem] = useState<{ list: string; id: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project?.creative_analysis) {
      setStrengths(parseToListItems(project.creative_analysis.strengths));
      setWeaknesses(parseToListItems(project.creative_analysis.weaknesses));
      setSuggestions(parseToListItems(project.creative_analysis.improvement_suggestions));
      setConfidentialNotes(project.creative_analysis.confidential_notes || '');
    }
  }, [project]);

  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      await updateAnalysis.mutateAsync({
        projectId,
        data: {
          strengths: listItemsToStrings(strengths) as unknown as Json,
          weaknesses: listItemsToStrings(weaknesses) as unknown as Json,
          improvement_suggestions: listItemsToStrings(suggestions) as unknown as Json,
          confidential_notes: confidentialNotes,
        },
      });
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
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
    handleSave();
  };

  const renderList = (
    items: ListItem[], 
    listName: 'strengths' | 'weaknesses' | 'suggestions',
    dotColor: string
  ) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2 group">
          <span className={`mt-2 w-2 h-2 rounded-full ${dotColor}`} />
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

  if (isLoading) {
    return (
      <CreativeLayout projectTitle="Cargando...">
        <PageSkeleton variant="cards" />
      </CreativeLayout>
    );
  }

  if (error || !project) {
    return (
      <CreativeLayout projectTitle="Error">
        <ErrorState message="No se pudo cargar el proyecto" />
      </CreativeLayout>
    );
  }

  const hasData = strengths.length > 0 || weaknesses.length > 0 || suggestions.length > 0;

  return (
    <CreativeLayout 
      projectTitle={project.title}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Ventajas y Desventajas</h2>
              <p className="text-muted-foreground">Análisis DAFO del guión</p>
            </div>
          </div>
          {hasData && (
            <Badge variant="secondary">
              <Sparkles className="w-3 h-3 mr-1" />
              IA
            </Badge>
          )}
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
              {renderList(strengths, 'strengths', 'bg-green-500')}
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
              {renderList(weaknesses, 'weaknesses', 'bg-red-500')}
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
              {renderList(suggestions, 'suggestions', 'bg-yellow-500')}
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
