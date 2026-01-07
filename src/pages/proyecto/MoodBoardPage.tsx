import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Palette, 
  Upload,
  Sparkles,
  Plus,
  Trash2,
  Film,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import { PageSkeleton, ErrorState } from '@/components/common/PageSkeleton';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface ColorItem {
  id: string;
  color: string;
  name: string;
}

interface MoodImage {
  id: string;
  url: string;
  caption: string;
  isAiGenerated: boolean;
}

function parseColorPalette(data: Json | null | undefined): ColorItem[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item, index) => {
    if (typeof item === 'object' && item !== null && 'color' in item) {
      return {
        id: String((item as { id?: string }).id || index),
        color: String((item as { color: string }).color),
        name: String((item as { name?: string }).name || 'Color'),
      };
    }
    return { id: String(index), color: '#888888', name: 'Color' };
  });
}

function parseVisualReferences(data: Json | null | undefined): MoodImage[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item, index) => {
    if (typeof item === 'object' && item !== null && 'url' in item) {
      return {
        id: String((item as { id?: string }).id || index),
        url: String((item as { url: string }).url),
        caption: String((item as { caption?: string }).caption || ''),
        isAiGenerated: Boolean((item as { isAiGenerated?: boolean }).isAiGenerated),
      };
    }
    return { id: String(index), url: '', caption: '', isAiGenerated: false };
  }).filter(img => img.url);
}

function parseReferences(data: Json | null | undefined): string[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter((item): item is string => typeof item === 'string');
}

export default function MoodBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading, error, refetch } = useProject(projectId);

  const [colorPalette, setColorPalette] = useState<ColorItem[]>([]);
  const [images, setImages] = useState<MoodImage[]>([]);
  const [cinematicStyle, setCinematicStyle] = useState('');
  const [directorReferences, setDirectorReferences] = useState<string[]>([]);
  const [dopReferences, setDopReferences] = useState<string[]>([]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newReference, setNewReference] = useState('');

  // We need to fetch mood_board separately since it's not in useProject
  const [moodBoard, setMoodBoard] = useState<{
    id?: string;
    color_palette?: Json;
    visual_references?: Json;
    cinematographic_style?: string | null;
    director_references?: Json;
    dop_references?: Json;
  } | null>(null);

  useEffect(() => {
    if (projectId) {
      supabase
        .from('mood_board')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setMoodBoard(data);
            setColorPalette(parseColorPalette(data.color_palette));
            setImages(parseVisualReferences(data.visual_references));
            setCinematicStyle(data.cinematographic_style || '');
            setDirectorReferences(parseReferences(data.director_references));
            setDopReferences(parseReferences(data.dop_references));
          }
        });
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        project_id: projectId,
        color_palette: colorPalette as unknown as Json,
        visual_references: images as unknown as Json,
        cinematographic_style: cinematicStyle,
        director_references: directorReferences as unknown as Json,
        dop_references: dopReferences as unknown as Json,
      };

      if (moodBoard?.id) {
        await supabase.from('mood_board').update(dataToSave).eq('id', moodBoard.id);
      } else {
        const { data } = await supabase.from('mood_board').insert(dataToSave).select().single();
        if (data) setMoodBoard(data);
      }
      
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addColorToPlette = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColorPalette(prev => [...prev, { id: `${Date.now()}`, color: randomColor, name: 'Nuevo color' }]);
  };

  const removeColor = (id: string) => {
    setColorPalette(prev => prev.filter(c => c.id !== id));
    handleSave();
  };

  const addReference = (type: 'director' | 'dop') => {
    if (!newReference.trim()) return;
    
    if (type === 'director') {
      setDirectorReferences(prev => [...prev, newReference]);
    } else {
      setDopReferences(prev => [...prev, newReference]);
    }
    setNewReference('');
    handleSave();
  };

  const removeReference = (type: 'director' | 'dop', index: number) => {
    if (type === 'director') {
      setDirectorReferences(prev => prev.filter((_, i) => i !== index));
    } else {
      setDopReferences(prev => prev.filter((_, i) => i !== index));
    }
    handleSave();
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    handleSave();
  };

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

  return (
    <CreativeLayout 
      projectTitle={project.title}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Color Palette */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Paleta de Colores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              {colorPalette.map((color) => (
                <div key={color.id} className="group relative">
                  <div 
                    className="w-16 h-16 rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: color.color }}
                  />
                  <button
                    onClick={() => removeColor(color.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  <p className="text-xs text-center mt-1 text-muted-foreground">{color.name}</p>
                  <p className="text-xs text-center font-mono text-muted-foreground">{color.color}</p>
                </div>
              ))}
              <Button variant="outline" size="icon" onClick={addColorToPlette} className="w-16 h-16">
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visual References Gallery */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Referencias Visuales
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={img.url} 
                      alt={img.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <p className="text-white text-sm text-center px-2">{img.caption}</p>
                      {img.isAiGenerated && (
                        <Badge variant="secondary">
                          <Sparkles className="w-3 h-3 mr-1" />
                          IA
                        </Badge>
                      )}
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => deleteImage(img.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay referencias visuales aún</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cinematographic Style */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Estilo Cinematográfico
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea
                value={cinematicStyle}
                onChange={(e) => setCinematicStyle(e.target.value)}
                onBlur={handleSave}
                rows={4}
                placeholder="Describe el estilo visual de tu proyecto..."
              />
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Referencias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Director references */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Directores de referencia</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {directorReferences.map((ref, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeReference('director', i)}
                    >
                      {ref} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Añadir director..."
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addReference('director')}
                  />
                  <Button variant="outline" size="icon" onClick={() => addReference('director')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* DOP references */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Directores de fotografía</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dopReferences.map((ref, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeReference('dop', i)}
                    >
                      {ref} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="Añadir DOP..."
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addReference('dop')}
                  />
                  <Button variant="outline" size="icon" onClick={() => addReference('dop')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CreativeLayout>
  );
}
