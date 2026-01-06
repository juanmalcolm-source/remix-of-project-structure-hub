import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Palette,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  Camera,
  Film,
  X,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ColorPalette {
  id: number;
  color: string;
  nombre: string;
}

interface ReferenciaVisual {
  id: string;
  url: string;
  titulo: string;
  categoria: string;
  descripcion?: string;
}

interface EstiloCinematografico {
  iluminacion: string;
  camara: string;
  directores: string[];
  peliculas: string[];
}

export default function MoodBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados
  const [paletaColores, setPaletaColores] = useState<ColorPalette[]>([
    { id: 1, color: '#1e40af', nombre: 'Azul profundo' },
    { id: 2, color: '#dc2626', nombre: 'Rojo intenso' },
    { id: 3, color: '#eab308', nombre: 'Amarillo cálido' },
    { id: 4, color: '#059669', nombre: 'Verde esmeralda' },
    { id: 5, color: '#4b5563', nombre: 'Gris neutro' },
  ]);

  const [referencias, setReferencias] = useState<ReferenciaVisual[]>([]);
  const [modalGeneracionIA, setModalGeneracionIA] = useState(false);
  const [modalImagenGrande, setModalImagenGrande] = useState<string | null>(null);
  const [generandoIA, setGenerandoIA] = useState(false);

  // Opciones IA
  const [promptIA, setPromptIA] = useState('');
  const [cantidadImagenes, setCantidadImagenes] = useState(4);
  const [estiloIA, setEstiloIA] = useState('Cinematográfico');
  const [epocaIA, setEpocaIA] = useState('Contemporáneo');
  const [ambienteIA, setAmbienteIA] = useState('Luz natural');

  const [estiloCine, setEstiloCine] = useState<EstiloCinematografico>({
    iluminacion: 'Roger Deakins en Blade Runner 2049',
    camara: 'Emmanuel Lubezki - planos secuencia',
    directores: ['Denis Villeneuve', 'Christopher Nolan'],
    peliculas: ['Blade Runner 2049', 'Dune'],
  });

  const [propuestaEstetica, setPropuestaEstetica] = useState(
    'El proyecto se caracteriza por una fotografía de alto contraste con predominancia de tonos fríos y azulados. ' +
    'La iluminación busca crear atmósferas envolventes con claroscuros marcados. Se propone un estilo visual ' +
    'que evoca el neo-noir contemporáneo, con especial atención a la textura y profundidad de campo.'
  );

  const [nuevoDirector, setNuevoDirector] = useState('');
  const [nuevaPelicula, setNuevaPelicula] = useState('');

  const categorias = ['Iluminación', 'Vestuario', 'Locaciones', 'Color', 'Composición', 'Ambiente', 'Otro'];

  // Handlers
  const handleColorChange = (id: number, color: string) => {
    setPaletaColores(paletaColores.map(p => 
      p.id === id ? { ...p, color } : p
    ));
  };

  const handleSugerirPaleta = async () => {
    toast({
      title: '🤖 Generando paleta',
      description: 'La IA está creando una paleta de colores basada en tu proyecto...',
    });
    
    // Simulación
    setTimeout(() => {
      const nuevaPaleta: ColorPalette[] = [
        { id: 1, color: '#0f172a', nombre: 'Azul midnight' },
        { id: 2, color: '#7c3aed', nombre: 'Púrpura vibrante' },
        { id: 3, color: '#facc15', nombre: 'Amarillo solar' },
        { id: 4, color: '#14b8a6', nombre: 'Turquesa' },
        { id: 5, color: '#f97316', nombre: 'Naranja fuego' },
      ];
      setPaletaColores(nuevaPaleta);
      toast({
        title: 'Paleta generada',
        description: 'Nueva paleta de colores aplicada',
      });
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (referencias.length + files.length > 20) {
      toast({
        title: 'Límite alcanzado',
        description: 'Máximo 20 imágenes permitidas',
        variant: 'destructive',
      });
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const nuevaRef: ReferenciaVisual = {
          id: Date.now().toString() + Math.random(),
          url: e.target?.result as string,
          titulo: file.name,
          categoria: 'Otro',
        };
        setReferencias(prev => [...prev, nuevaRef]);
      };
      reader.readAsDataURL(file);
    });

    toast({
      title: 'Imágenes añadidas',
      description: `${files.length} imagen(es) subida(s)`,
    });
  };

  const handleGenerarConIA = async () => {
    if (!promptIA.trim()) {
      toast({
        title: 'Descripción requerida',
        description: 'Por favor describe el estilo que deseas',
        variant: 'destructive',
      });
      return;
    }

    setGenerandoIA(true);
    
    // Simulación de generación
    setTimeout(() => {
      const nuevasRefs: ReferenciaVisual[] = [];
      for (let i = 0; i < cantidadImagenes; i++) {
        nuevasRefs.push({
          id: Date.now().toString() + i,
          url: `https://placehold.co/600x400/4f46e5/white?text=IA+Generated+${i + 1}`,
          titulo: `Referencia IA ${i + 1}`,
          categoria: 'Ambiente',
          descripcion: `Generado con: ${promptIA}`,
        });
      }
      
      setReferencias(prev => [...prev, ...nuevasRefs]);
      setGenerandoIA(false);
      setModalGeneracionIA(false);
      setPromptIA('');
      
      toast({
        title: '✨ Imágenes generadas',
        description: `${cantidadImagenes} referencias visuales añadidas`,
      });
    }, 3000);
  };

  const handleEliminarReferencia = (id: string) => {
    setReferencias(referencias.filter(r => r.id !== id));
    toast({
      title: 'Imagen eliminada',
      description: 'Referencia visual eliminada del mood board',
    });
  };

  const handleAddDirector = () => {
    if (nuevoDirector.trim()) {
      setEstiloCine(prev => ({
        ...prev,
        directores: [...prev.directores, nuevoDirector.trim()]
      }));
      setNuevoDirector('');
    }
  };

  const handleRemoveDirector = (index: number) => {
    setEstiloCine(prev => ({
      ...prev,
      directores: prev.directores.filter((_, i) => i !== index)
    }));
  };

  const handleAddPelicula = () => {
    if (nuevaPelicula.trim()) {
      setEstiloCine(prev => ({
        ...prev,
        peliculas: [...prev.peliculas, nuevaPelicula.trim()]
      }));
      setNuevaPelicula('');
    }
  };

  const handleRemovePelicula = (index: number) => {
    setEstiloCine(prev => ({
      ...prev,
      peliculas: prev.peliculas.filter((_, i) => i !== index)
    }));
  };

  const handleRegenerarPropuesta = () => {
    toast({
      title: '🤖 Regenerando propuesta',
      description: 'La IA está creando una nueva propuesta estética...',
    });
    
    setTimeout(() => {
      setPropuestaEstetica(
        'El proyecto adopta un lenguaje visual contemporáneo con influencias del cine de autor europeo. ' +
        'La paleta de colores se centra en tonos terrosos y desaturados, creando una atmósfera íntima y contemplativa. ' +
        'La fotografía privilegia el uso de luz natural y encuadres cuidadosamente compuestos que refuerzan la narrativa.'
      );
      toast({
        title: 'Propuesta regenerada',
        description: 'Nueva visión estética creada',
      });
    }, 1500);
  };

  const handleExportarPDF = () => {
    toast({
      title: 'Exportando Mood Board',
      description: 'Generando PDF con todas las referencias visuales...',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Mood Board
              </h1>
              <p className="text-sm text-muted-foreground">
                Referencia visual y paleta cromática del proyecto
              </p>
            </div>
            
            <Button onClick={handleExportarPDF}>
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Nota informativa */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta sección es opcional pero muy útil para comunicar la visión artística del proyecto a tu equipo, 
            inversores y colaboradores creativos.
          </AlertDescription>
        </Alert>

        {/* SECCIÓN 1: PALETA DE COLORES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Paleta de Colores
              </div>
              <Button variant="outline" size="sm" onClick={handleSugerirPaleta}>
                <Sparkles className="w-4 h-4 mr-2" />
                Sugerir paleta con IA
              </Button>
            </CardTitle>
            <CardDescription>
              Define los colores principales que representan tu proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {paletaColores.map((color) => (
                <div key={color.id} className="space-y-3">
                  <div className="relative">
                    <div
                      className="w-full aspect-square rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform border-4 border-white dark:border-gray-800"
                      style={{ backgroundColor: color.color }}
                      onClick={() => document.getElementById(`color-${color.id}`)?.click()}
                    />
                    <input
                      id={`color-${color.id}`}
                      type="color"
                      value={color.color}
                      onChange={(e) => handleColorChange(color.id, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-center">
                    <Input
                      value={color.nombre}
                      onChange={(e) => {
                        setPaletaColores(paletaColores.map(p => 
                          p.id === color.id ? { ...p, nombre: e.target.value } : p
                        ));
                      }}
                      className="text-center text-sm"
                      placeholder="Nombre del color"
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {color.color.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Exportar códigos HEX:</p>
              <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                {paletaColores.map(c => c.color.toUpperCase()).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 2: REFERENCIAS VISUALES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Referencias Visuales
              </div>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={referencias.length >= 20}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir imágenes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalGeneracionIA(true)}
                  disabled={referencias.length >= 20}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar con IA
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Máximo 20 imágenes • {referencias.length}/20 utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referencias.length === 0 ? (
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No hay referencias visuales</p>
                <p className="text-sm text-muted-foreground">
                  Haz clic para subir imágenes o genera referencias con IA
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {referencias.map((ref) => (
                  <Card key={ref.id} className="group overflow-hidden hover:shadow-xl transition-all">
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={ref.url}
                        alt={ref.titulo}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setModalImagenGrande(ref.url)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEliminarReferencia(ref.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <Input
                        value={ref.titulo}
                        onChange={(e) => {
                          setReferencias(referencias.map(r =>
                            r.id === ref.id ? { ...r, titulo: e.target.value } : r
                          ));
                        }}
                        className="text-sm h-8"
                        placeholder="Título"
                      />
                      <Select
                        value={ref.categoria}
                        onValueChange={(v) => {
                          setReferencias(referencias.map(r =>
                            r.id === ref.id ? { ...r, categoria: v } : r
                          ));
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECCIÓN 3: ESTILO CINEMATOGRÁFICO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Estilo Cinematográfico
            </CardTitle>
            <CardDescription>
              Referencias de directores, directores de fotografía y películas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Referencia de iluminación</label>
                <Input
                  value={estiloCine.iluminacion}
                  onChange={(e) => setEstiloCine(prev => ({ ...prev, iluminacion: e.target.value }))}
                  placeholder="ej: Roger Deakins en Blade Runner 2049"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Referencia de cámara</label>
                <Input
                  value={estiloCine.camara}
                  onChange={(e) => setEstiloCine(prev => ({ ...prev, camara: e.target.value }))}
                  placeholder="ej: Emmanuel Lubezki - planos secuencia"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Directores de referencia</label>
              <div className="flex gap-2">
                <Input
                  value={nuevoDirector}
                  onChange={(e) => setNuevoDirector(e.target.value)}
                  placeholder="Nombre del director..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDirector()}
                />
                <Button onClick={handleAddDirector}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {estiloCine.directores.map((director, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {director}
                    <button
                      onClick={() => handleRemoveDirector(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Películas benchmark</label>
              <div className="flex gap-2">
                <Input
                  value={nuevaPelicula}
                  onChange={(e) => setNuevaPelicula(e.target.value)}
                  placeholder="Título de la película..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPelicula()}
                />
                <Button onClick={handleAddPelicula}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {estiloCine.peliculas.map((pelicula, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {pelicula}
                    <button
                      onClick={() => handleRemovePelicula(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 4: PROPUESTA ESTÉTICA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Propuesta Estética</span>
              <Button variant="outline" size="sm" onClick={handleRegenerarPropuesta}>
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerar propuesta
              </Button>
            </CardTitle>
            <CardDescription>
              Descripción del concepto visual del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={propuestaEstetica}
              onChange={(e) => setPropuestaEstetica(e.target.value)}
              rows={8}
              className="resize-none"
              placeholder="Describe el look general, propuesta de fotografía, sugerencias de arte..."
            />
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/creativa/viabilidad', { state: { analisis } })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Viabilidad
          </Button>
          <Button onClick={() => navigate('/creativa/overview', { state: { analisis } })}>
            Volver a Overview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* MODAL GENERACIÓN IA */}
      <Dialog open={modalGeneracionIA} onOpenChange={setModalGeneracionIA}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar Referencias Visuales con IA</DialogTitle>
            <DialogDescription>
              Describe el estilo visual que deseas y la IA generará imágenes de referencia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descripción del estilo deseado
              </label>
              <Textarea
                value={promptIA}
                onChange={(e) => setPromptIA(e.target.value)}
                rows={3}
                placeholder="ej: Escenas cyberpunk con iluminación neon, tonos azules y magentas, ambiente nocturno..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cantidad</label>
                <Select value={cantidadImagenes.toString()} onValueChange={(v) => setCantidadImagenes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 imágenes</SelectItem>
                    <SelectItem value="8">8 imágenes</SelectItem>
                    <SelectItem value="12">12 imágenes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estilo</label>
                <Select value={estiloIA} onValueChange={setEstiloIA}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Realista">Realista</SelectItem>
                    <SelectItem value="Cinematográfico">Cinematográfico</SelectItem>
                    <SelectItem value="Artístico">Artístico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Época</label>
                <Select value={epocaIA} onValueChange={setEpocaIA}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contemporáneo">Contemporáneo</SelectItem>
                    <SelectItem value="Vintage">Vintage</SelectItem>
                    <SelectItem value="Futurista">Futurista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ambiente</label>
                <Select value={ambienteIA} onValueChange={setAmbienteIA}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luz natural">Luz natural</SelectItem>
                    <SelectItem value="Oscuro">Oscuro</SelectItem>
                    <SelectItem value="Colorido">Colorido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerarConIA}
                disabled={generandoIA || !promptIA.trim()}
                className="flex-1"
              >
                {generandoIA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando... (~30s)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generar Mood Board
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setModalGeneracionIA(false)}
                disabled={generandoIA}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL IMAGEN GRANDE */}
      <Dialog open={!!modalImagenGrande} onOpenChange={() => setModalImagenGrande(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh]">
            <img
              src={modalImagenGrande || ''}
              alt="Vista grande"
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
