import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Search,
  Upload,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Users,
  Heart,
  Sword,
  Home,
  User,
  Download,
  GripVertical,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion, Personaje } from '@/types/analisisGuion';

interface PersonajeExtendido extends Personaje {
  foto?: string;
  arco_dramatico?: string;
  propuesta_casting?: string;
  actores_alternativos?: string[];
  relaciones?: Array<{
    personaje_id: string;
    tipo: 'Familia' | 'Amistad' | 'Conflicto' | 'Amor';
  }>;
  notas_produccion?: string;
  tarifa_estimada?: number;
}

type FiltroCategoria = 'Todos' | 'PROTAGONISTA' | 'PRINCIPAL' | 'SECUNDARIO' | 'FIGURACION';
type OrdenarPor = 'nombre' | 'dias_rodaje' | 'categoria';

export default function Personajes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados
  const [personajes, setPersonajes] = useState<PersonajeExtendido[]>(
    analisis?.personajes?.map(p => ({
      ...p,
      arco_dramatico: 'Arco dramático del personaje por definir...',
      propuesta_casting: '',
      actores_alternativos: [],
      relaciones: [],
      notas_produccion: '',
      tarifa_estimada: 0
    })) || []
  );

  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('Todos');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('categoria');
  const [busqueda, setBusqueda] = useState('');
  const [personajeSeleccionado, setPersonajeSeleccionado] = useState<PersonajeExtendido | null>(null);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [vistaActual, setVistaActual] = useState<'grid' | 'mapa'>('grid');

  // Cálculos
  const conteosPorCategoria = useMemo(() => {
    return {
      PROTAGONISTA: personajes.filter(p => p.categoria === 'PROTAGONISTA').length,
      PRINCIPAL: personajes.filter(p => p.categoria === 'PRINCIPAL').length,
      SECUNDARIO: personajes.filter(p => p.categoria === 'SECUNDARIO').length,
      FIGURACION: personajes.filter(p => p.categoria === 'FIGURACION').length,
    };
  }, [personajes]);

  const personajesFiltrados = useMemo(() => {
    let resultado = personajes;

    // Filtro por categoría
    if (filtroCategoria !== 'Todos') {
      resultado = resultado.filter(p => p.categoria === filtroCategoria);
    }

    // Búsqueda por nombre
    if (busqueda) {
      resultado = resultado.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Ordenamiento
    resultado = [...resultado].sort((a, b) => {
      if (ordenarPor === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (ordenarPor === 'dias_rodaje') {
        return b.dias_rodaje_estimados - a.dias_rodaje_estimados;
      }
      if (ordenarPor === 'categoria') {
        const orden = ['PROTAGONISTA', 'PRINCIPAL', 'SECUNDARIO', 'FIGURACION'];
        return orden.indexOf(a.categoria) - orden.indexOf(b.categoria);
      }
      return 0;
    });

    return resultado;
  }, [personajes, filtroCategoria, busqueda, ordenarPor]);

  const diasTotales = useMemo(() => {
    return personajes.reduce((sum, p) => sum + p.dias_rodaje_estimados, 0);
  }, [personajes]);

  // Handlers
  const handleSugerirActores = async (personaje: PersonajeExtendido) => {
    toast({
      title: '🤖 Buscando actores',
      description: `Analizando características de ${personaje.nombre}...`,
    });
    
    // Simulación - aquí iría la llamada a IA
    setTimeout(() => {
      const sugerencias = ['Actor A', 'Actor B', 'Actor C'];
      setPersonajes(personajes.map(p => 
        p.nombre === personaje.nombre 
          ? { ...p, actores_alternativos: sugerencias }
          : p
      ));
      toast({
        title: 'Sugerencias generadas',
        description: `${sugerencias.length} actores sugeridos para ${personaje.nombre}`,
      });
    }, 1500);
  };

  const handleEliminarPersonaje = (nombre: string) => {
    setPersonajes(personajes.filter(p => p.nombre !== nombre));
    toast({
      title: 'Personaje eliminado',
      description: `${nombre} ha sido eliminado de la lista`,
    });
  };

  const handleExportarPDF = () => {
    toast({
      title: 'Exportando a PDF',
      description: 'Generando documento con lista de personajes...',
    });
  };

  const handleVerDetalles = (personaje: PersonajeExtendido) => {
    setPersonajeSeleccionado(personaje);
    setModalDetalles(true);
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'PROTAGONISTA': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'PRINCIPAL': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'SECUNDARIO': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'FIGURACION': return 'bg-gray-500 hover:bg-gray-600 text-white';
      default: return 'bg-gray-500';
    }
  };

  const getRelacionIcon = (tipo: string) => {
    switch (tipo) {
      case 'Familia': return <Home className="w-4 h-4" />;
      case 'Amistad': return <Users className="w-4 h-4" />;
      case 'Conflicto': return <Sword className="w-4 h-4" />;
      case 'Amor': return <Heart className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Personajes
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestión de personajes y propuestas de casting
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportarPDF}>
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Badges de categorías */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              Protagonistas: {conteosPorCategoria.PROTAGONISTA}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              Principales: {conteosPorCategoria.PRINCIPAL}
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
              Secundarios: {conteosPorCategoria.SECUNDARIO}
            </Badge>
            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
              Figuración: {conteosPorCategoria.FIGURACION}
            </Badge>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="outline">
              Total días rodaje: {diasTotales}
            </Badge>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar personaje por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroCategoria} onValueChange={(v) => setFiltroCategoria(v as FiltroCategoria)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="PROTAGONISTA">Protagonistas</SelectItem>
                <SelectItem value="PRINCIPAL">Principales</SelectItem>
                <SelectItem value="SECUNDARIO">Secundarios</SelectItem>
                <SelectItem value="FIGURACION">Figuración</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ordenarPor} onValueChange={(v) => setOrdenarPor(v as OrdenarPor)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Nombre</SelectItem>
                <SelectItem value="dias_rodaje">Días rodaje</SelectItem>
                <SelectItem value="categoria">Categoría</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as 'grid' | 'mapa')} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="mapa">Mapa</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {vistaActual === 'grid' ? (
          // VISTA GRID DE PERSONAJES
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personajesFiltrados.map((personaje) => (
              <Card key={personaje.nombre} className="hover:shadow-xl transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{personaje.nombre}</CardTitle>
                      <Badge className={getCategoriaColor(personaje.categoria)}>
                        {personaje.categoria}
                      </Badge>
                    </div>
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  </div>

                  {/* Placeholder foto */}
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group/foto">
                    {personaje.foto ? (
                      <img src={personaje.foto} alt={personaje.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover/foto:opacity-100 transition-opacity"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Descripción */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {personaje.genero} • {personaje.edad_aproximada}
                    </p>
                    <p className="text-sm line-clamp-2">{personaje.descripcion}</p>
                  </div>

                  <Separator />

                  {/* Arco dramático */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Arco dramático</label>
                    <Textarea
                      value={personaje.arco_dramatico}
                      onChange={(e) => {
                        setPersonajes(personajes.map(p => 
                          p.nombre === personaje.nombre 
                            ? { ...p, arco_dramatico: e.target.value }
                            : p
                        ));
                      }}
                      rows={2}
                      className="text-sm mt-1"
                      placeholder="Describe el arco del personaje..."
                    />
                  </div>

                  {/* Días de rodaje */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{personaje.dias_rodaje_estimados} días de rodaje</span>
                  </div>

                  {/* Escenas colapsables */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <span>Aparece en {personaje.escenas_aparicion.length} escenas</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {personaje.escenas_aparicion.slice(0, 10).map((escena) => (
                          <Badge key={escena} variant="outline" className="text-xs">
                            {escena}
                          </Badge>
                        ))}
                        {personaje.escenas_aparicion.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{personaje.escenas_aparicion.length - 10}
                          </Badge>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />

                  {/* Propuesta de casting */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Propuesta de casting</label>
                    <Input
                      value={personaje.propuesta_casting}
                      onChange={(e) => {
                        setPersonajes(personajes.map(p => 
                          p.nombre === personaje.nombre 
                            ? { ...p, propuesta_casting: e.target.value }
                            : p
                        ));
                      }}
                      placeholder="Nombre del actor..."
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSugerirActores(personaje)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sugerir actores con IA
                    </Button>
                    
                    {personaje.actores_alternativos && personaje.actores_alternativos.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Alternativas:</p>
                        {personaje.actores_alternativos.map((actor, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 text-xs">
                            {actor}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleVerDetalles(personaje)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Detalles
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEliminarPersonaje(personaje.nombre)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // VISTA MAPA DE RELACIONES
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Relaciones</CardTitle>
              <CardDescription>
                Visualización de conexiones entre personajes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center space-y-4">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-semibold">Mapa de Relaciones</p>
                    <p className="text-sm text-muted-foreground">
                      Visualización interactiva de red de personajes
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <Home className="w-3 h-3" /> Familia
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" /> Amistad
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Sword className="w-3 h-3" /> Conflicto
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Heart className="w-3 h-3" /> Amor
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Esta funcionalidad requiere configurar las relaciones entre personajes.
                    Click en un personaje en la vista Grid para editar sus relaciones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegación inferior */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/creativa/analisis-narrativo', { state: { analisis } })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Análisis Narrativo
          </Button>
          <Button onClick={() => toast({ title: 'Siguiente sección en construcción' })}>
            Siguiente: Localizaciones
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* MODAL DE DETALLES */}
      <Dialog open={modalDetalles} onOpenChange={setModalDetalles}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {personajeSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Información completa del personaje
            </DialogDescription>
          </DialogHeader>

          {personajeSeleccionado && (
            <ScrollArea className="h-[60vh] pr-4">
              <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="relaciones">Relaciones</TabsTrigger>
                  <TabsTrigger value="produccion">Producción</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Categoría</label>
                      <Badge className={getCategoriaColor(personajeSeleccionado.categoria) + " mt-1"}>
                        {personajeSeleccionado.categoria}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Importancia</label>
                      <p className="text-sm mt-1">{personajeSeleccionado.importancia_trama}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Género</label>
                      <p className="text-sm mt-1">{personajeSeleccionado.genero}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Edad</label>
                      <p className="text-sm mt-1">{personajeSeleccionado.edad_aproximada}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium">Descripción</label>
                    <p className="text-sm mt-2">{personajeSeleccionado.descripcion}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Primera aparición</label>
                    <p className="text-sm mt-2">{personajeSeleccionado.primera_aparicion}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Arco dramático</label>
                    <Textarea
                      value={personajeSeleccionado.arco_dramatico}
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Apariciones en escenas</h3>
                    <div className="space-y-2">
                      {personajeSeleccionado.escenas_aparicion.map((escena) => (
                        <div key={escena} className="flex items-center gap-3 p-2 border rounded-lg">
                          <Badge variant="outline">Escena {escena}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {personajeSeleccionado.dialogos_principales ? 'Con diálogos' : 'Sin diálogos'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="relaciones" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Relaciones con otros personajes</h3>
                    <p className="text-sm text-muted-foreground">
                      Configura las relaciones de este personaje con otros del guión
                    </p>
                    {/* Aquí iría el configurador de relaciones */}
                    <div className="mt-4 p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No hay relaciones configuradas</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="produccion" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Días de rodaje</label>
                      <p className="text-lg font-bold mt-1">{personajeSeleccionado.dias_rodaje_estimados}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tarifa diaria estimada</label>
                      <Input
                        type="number"
                        value={personajeSeleccionado.tarifa_estimada || 0}
                        onChange={(e) => {
                          setPersonajes(personajes.map(p => 
                            p.nombre === personajeSeleccionado.nombre 
                              ? { ...p, tarifa_estimada: Number(e.target.value) }
                              : p
                          ));
                        }}
                        className="mt-1"
                        placeholder="€ / día"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Presupuesto estimado</label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      €{((personajeSeleccionado.tarifa_estimada || 0) * personajeSeleccionado.dias_rodaje_estimados).toLocaleString()}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium">Notas de producción</label>
                    <Textarea
                      value={personajeSeleccionado.notas_produccion}
                      onChange={(e) => {
                        setPersonajes(personajes.map(p => 
                          p.nombre === personajeSeleccionado.nombre 
                            ? { ...p, notas_produccion: e.target.value }
                            : p
                        ));
                      }}
                      rows={4}
                      className="mt-2"
                      placeholder="Requisitos especiales, consideraciones de casting, etc..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
