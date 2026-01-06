import { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import type { AnalisisGuion } from '@/types/analisisGuion';

interface MoodImage {
  id: string;
  url: string;
  caption: string;
  isAiGenerated: boolean;
}

export default function MoodBoardPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [colorPalette, setColorPalette] = useState([
    { id: '1', color: '#1a1a2e', name: 'Azul noche' },
    { id: '2', color: '#16213e', name: 'Azul profundo' },
    { id: '3', color: '#0f3460', name: 'Azul medio' },
    { id: '4', color: '#e94560', name: 'Rojo coral' },
    { id: '5', color: '#f5f5f5', name: 'Blanco hueso' },
  ]);

  const [images, setImages] = useState<MoodImage[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400', caption: 'Atmósfera cinematográfica', isAiGenerated: false },
    { id: '2', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', caption: 'Iluminación dramática', isAiGenerated: false },
  ]);

  const [cinematicStyle, setCinematicStyle] = useState('Noir contemporáneo con toques de thriller psicológico');
  const [directorReferences, setDirectorReferences] = useState(['David Fincher', 'Denis Villeneuve']);
  const [dopReferences, setDopReferences] = useState(['Roger Deakins', 'Hoyte van Hoytema']);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [newReference, setNewReference] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate AI image generation
    const newImage: MoodImage = {
      id: `${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
      caption: 'Generado con IA',
      isAiGenerated: true,
    };
    
    setImages(prev => [...prev, newImage]);
    toast({ title: 'Imagen generada con IA' });
    setIsGeneratingImage(false);
  };

  const handleUploadImage = () => {
    // In a real implementation, this would open a file picker
    toast({ title: 'Función de subida próximamente' });
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    toast({ title: 'Imagen eliminada' });
  };

  const addColorToPlette = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    setColorPalette(prev => [...prev, { id: `${Date.now()}`, color: randomColor, name: 'Nuevo color' }]);
  };

  const removeColor = (id: string) => {
    setColorPalette(prev => prev.filter(c => c.id !== id));
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
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <CreativeLayout 
      projectTitle={projectTitle}
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
                <Button variant="outline" size="sm" onClick={handleUploadImage}>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingImage ? 'Generando...' : 'Generar con IA'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
              
              {/* Upload placeholder */}
              <div 
                className="aspect-video border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleUploadImage}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Subir imagen</p>
                </div>
              </div>
            </div>
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
