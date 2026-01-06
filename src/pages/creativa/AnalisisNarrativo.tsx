import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit2,
  GripVertical,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Label as RechartsLabel
} from 'recharts';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ActoData {
  acto: string;
  paginas: string;
  porcentaje: number;
  puntosClaveEditables: {
    [key: string]: number;
  };
}

interface PuntoEmocional {
  pagina: number;
  intensidad: number;
  anotacion?: string;
}

interface Ventaja {
  id: string;
  ventaja: string;
  descripcion: string;
  impacto: 'Alto' | 'Medio' | 'Bajo';
}

interface Desventaja {
  id: string;
  debilidad: string;
  descripcion: string;
  impacto: 'Alto' | 'Medio' | 'Bajo';
  incluirEnDossier: boolean;
}

interface PropuestaMejora {
  id: string;
  descripcion: string;
  paginaRecomendada: number;
}

export default function AnalisisNarrativo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados
  const [actos, setActos] = useState<ActoData[]>([
    {
      acto: 'Acto I',
      paginas: '1-25',
      porcentaje: 28,
      puntosClaveEditables: {
        'Inciting': 12,
        'Point 1': 25
      }
    },
    {
      acto: 'Acto II',
      paginas: '26-75',
      porcentaje: 56,
      puntosClaveEditables: {
        'Midpoint': 50,
        'Point 2': 75
      }
    },
    {
      acto: 'Acto III',
      paginas: '76-90',
      porcentaje: 16,
      puntosClaveEditables: {
        'Clímax': 85,
        'Resolución': 88
      }
    }
  ]);

  const [puntosEmocionales, setPuntosEmocionales] = useState<PuntoEmocional[]>([
    { pagina: 0, intensidad: 3, anotacion: 'Inicio' },
    { pagina: 12, intensidad: 6, anotacion: 'Inciting incident' },
    { pagina: 25, intensidad: 7, anotacion: 'Punto de giro potente' },
    { pagina: 50, intensidad: 5, anotacion: 'Midpoint' },
    { pagina: 75, intensidad: 9, anotacion: 'Crisis máxima' },
    { pagina: 85, intensidad: 10, anotacion: 'Clímax' },
    { pagina: 90, intensidad: 4, anotacion: 'Resolución' },
  ]);

  const [ventajas, setVentajas] = useState<Ventaja[]>([
    {
      id: '1',
      ventaja: 'Ritmo narrativo sólido',
      descripcion: 'La historia mantiene un buen ritmo con revelaciones constantes',
      impacto: 'Alto'
    },
    {
      id: '2',
      ventaja: 'Arco del protagonista claro',
      descripcion: 'La evolución del personaje principal es coherente y satisfactoria',
      impacto: 'Alto'
    }
  ]);

  const [desventajas, setDesventajas] = useState<Desventaja[]>([
    {
      id: '1',
      debilidad: 'Acto II se alarga',
      descripcion: 'El segundo acto pierde momentum en las páginas 40-55',
      impacto: 'Medio',
      incluirEnDossier: false
    }
  ]);

  const [propuestasMejora, setPropuestasMejora] = useState<PropuestaMejora[]>([
    {
      id: '1',
      descripcion: 'Adelantar el midpoint a la página 45 para mantener el ritmo',
      paginaRecomendada: 45
    }
  ]);

  const [nuevaVentaja, setNuevaVentaja] = useState<{ ventaja: string; descripcion: string; impacto: 'Alto' | 'Medio' | 'Bajo' }>({ ventaja: '', descripcion: '', impacto: 'Medio' });
  const [nuevaDesventaja, setNuevaDesventaja] = useState<{ debilidad: string; descripcion: string; impacto: 'Alto' | 'Medio' | 'Bajo' }>({ debilidad: '', descripcion: '', impacto: 'Medio' });
  const [nuevaPropuesta, setNuevaPropuesta] = useState({ descripcion: '', paginaRecomendada: 0 });
  const [dialogVentajaOpen, setDialogVentajaOpen] = useState(false);
  const [dialogDesventajaOpen, setDialogDesventajaOpen] = useState(false);
  const [dialogPropuestaOpen, setDialogPropuestaOpen] = useState(false);

  if (!analisis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">No hay análisis disponible</p>
            <Button onClick={() => navigate('/upload')}>Analizar guión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaginas = analisis.informacion_general.paginas_totales;

  const handleRecalcularEstructura = () => {
    toast({
      title: 'Estructura recalculada',
      description: 'Se han actualizado los puntos de estructura basados en el análisis IA',
    });
  };

  const verificarProporcionesAtipicas = () => {
    const actoI = actos[0].porcentaje;
    const actoII = actos[1].porcentaje;
    const actoIII = actos[2].porcentaje;
    
    if (actoI < 20 || actoI > 35) return true;
    if (actoII < 45 || actoII > 65) return true;
    if (actoIII < 10 || actoIII > 25) return true;
    return false;
  };

  const handleAnadirVentaja = () => {
    if (!nuevaVentaja.ventaja || !nuevaVentaja.descripcion) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos',
        variant: 'destructive'
      });
      return;
    }
    
    setVentajas([...ventajas, { ...nuevaVentaja, id: Date.now().toString() }]);
    setNuevaVentaja({ ventaja: '', descripcion: '', impacto: 'Medio' });
    setDialogVentajaOpen(false);
    toast({ title: 'Ventaja añadida' });
  };

  const handleAnadirDesventaja = () => {
    if (!nuevaDesventaja.debilidad || !nuevaDesventaja.descripcion) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos',
        variant: 'destructive'
      });
      return;
    }
    
    setDesventajas([...desventajas, { 
      ...nuevaDesventaja, 
      id: Date.now().toString(),
      incluirEnDossier: false
    }]);
    setNuevaDesventaja({ debilidad: '', descripcion: '', impacto: 'Medio' });
    setDialogDesventajaOpen(false);
    toast({ title: 'Desventaja añadida' });
  };

  const handleAnadirPropuesta = () => {
    if (!nuevaPropuesta.descripcion) {
      toast({
        title: 'Campo requerido',
        description: 'Por favor escribe una descripción',
        variant: 'destructive'
      });
      return;
    }
    
    setPropuestasMejora([...propuestasMejora, { 
      ...nuevaPropuesta, 
      id: Date.now().toString()
    }]);
    setNuevaPropuesta({ descripcion: '', paginaRecomendada: 0 });
    setDialogPropuestaOpen(false);
    toast({ title: 'Propuesta añadida' });
  };

  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case 'Alto': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'Medio': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Bajo': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Análisis Narrativo
              </h1>
              <p className="text-sm text-muted-foreground">
                {analisis.informacion_general.titulo}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/overview', { state: { analisis } })}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Overview
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="estructura" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="estructura">Estructura</TabsTrigger>
            <TabsTrigger value="sensaciones">Mapa Emocional</TabsTrigger>
            <TabsTrigger value="ventajas">Ventajas</TabsTrigger>
            <TabsTrigger value="desventajas">Desventajas</TabsTrigger>
            <TabsTrigger value="propuestas">Propuestas</TabsTrigger>
          </TabsList>

          {/* SECCIÓN 1: ESTRUCTURA DE 3 ACTOS */}
          <TabsContent value="estructura" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estructura de 3 Actos</CardTitle>
                    <CardDescription>
                      Análisis de la distribución narrativa del guión
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleRecalcularEstructura}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Recalcular estructura
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warning si proporciones atípicas */}
                {verificarProporcionesAtipicas() && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-300">
                        Proporciones atípicas detectadas
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        La estructura se desvía de la proporción estándar 25-50-25. Esto puede ser intencional o requerir ajustes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabla de Actos */}
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Acto</TableHead>
                        <TableHead>Páginas</TableHead>
                        <TableHead>%</TableHead>
                        <TableHead>Puntos clave</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actos.map((acto, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{acto.acto}</TableCell>
                          <TableCell>
                            <Input
                              value={acto.paginas}
                              onChange={(e) => {
                                const nuevosActos = [...actos];
                                nuevosActos[index].paginas = e.target.value;
                                setActos(nuevosActos);
                              }}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{acto.porcentaje}%</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(acto.puntosClaveEditables).map(([nombre, pagina]) => (
                                <div key={nombre} className="flex items-center gap-1 text-sm">
                                  <span className="text-muted-foreground">{nombre}:</span>
                                  <Input
                                    type="number"
                                    value={pagina}
                                    onChange={(e) => {
                                      const nuevosActos = [...actos];
                                      nuevosActos[index].puntosClaveEditables[nombre] = parseInt(e.target.value) || 0;
                                      setActos(nuevosActos);
                                    }}
                                    className="w-16 h-7 px-2 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Barra visual de proporción */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Proporción visual</p>
                  <div className="flex h-12 rounded-lg overflow-hidden border">
                    {actos.map((acto, index) => (
                      <div
                        key={index}
                        style={{ width: `${acto.porcentaje}%` }}
                        className={`flex items-center justify-center text-xs font-medium transition-all hover:opacity-80 ${
                          index === 0 
                            ? 'bg-blue-500 text-white' 
                            : index === 1 
                            ? 'bg-purple-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {acto.acto}: {acto.porcentaje}%
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referencia estándar */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Referencia estándar:</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Acto I: 25-30%</span>
                    <span>Acto II: 50-55%</span>
                    <span>Acto III: 15-25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECCIÓN 2: MAPA DE SENSACIONES */}
          <TabsContent value="sensaciones" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Mapa de Sensaciones</CardTitle>
                    <CardDescription>
                      Curva de intensidad emocional a lo largo del guión
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Añadir punto
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Añadir punto emocional</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Página</Label>
                            <Input
                              type="number"
                              placeholder="Número de página"
                              onChange={(e) => {
                                const nuevoPunto = { pagina: parseInt(e.target.value) || 0, intensidad: 5 };
                                setPuntosEmocionales([...puntosEmocionales, nuevoPunto].sort((a, b) => a.pagina - b.pagina));
                              }}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gráfico */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={puntosEmocionales}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="pagina" 
                        label={{ value: 'Páginas', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Intensidad', angle: -90, position: 'insideLeft' }}
                        domain={[0, 10]}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">Página {data.pagina}</p>
                                <p className="text-sm text-muted-foreground">
                                  Intensidad: {data.intensidad}/10
                                </p>
                                {data.anotacion && (
                                  <p className="text-sm mt-1">{data.anotacion}</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="intensidad" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                      {/* Líneas de referencia para los actos */}
                      <ReferenceLine x={25} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <ReferenceLine x={75} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Lista de puntos editables */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Puntos emocionales</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {puntosEmocionales.map((punto, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={punto.pagina}
                          onChange={(e) => {
                            const nuevosPuntos = [...puntosEmocionales];
                            nuevosPuntos[index].pagina = parseInt(e.target.value) || 0;
                            setPuntosEmocionales(nuevosPuntos.sort((a, b) => a.pagina - b.pagina));
                          }}
                          className="w-20"
                          placeholder="Pág."
                        />
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={punto.intensidad}
                          onChange={(e) => {
                            const nuevosPuntos = [...puntosEmocionales];
                            nuevosPuntos[index].intensidad = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                            setPuntosEmocionales(nuevosPuntos);
                          }}
                          className="w-20"
                          placeholder="0-10"
                        />
                        <Input
                          value={punto.anotacion || ''}
                          onChange={(e) => {
                            const nuevosPuntos = [...puntosEmocionales];
                            nuevosPuntos[index].anotacion = e.target.value;
                            setPuntosEmocionales(nuevosPuntos);
                          }}
                          className="flex-1"
                          placeholder="Anotación"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPuntosEmocionales(puntosEmocionales.filter((_, i) => i !== index));
                            toast({ title: 'Punto eliminado' });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECCIÓN 3: VENTAJAS NARRATIVAS */}
          <TabsContent value="ventajas" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Ventajas Narrativas
                    </CardTitle>
                    <CardDescription>
                      Fortalezas del guión para destacar en el dossier
                    </CardDescription>
                  </div>
                  <Dialog open={dialogVentajaOpen} onOpenChange={setDialogVentajaOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir ventaja
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva ventaja narrativa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Ventaja</Label>
                          <Input
                            value={nuevaVentaja.ventaja}
                            onChange={(e) => setNuevaVentaja({ ...nuevaVentaja, ventaja: e.target.value })}
                            placeholder="Ej: Diálogos ágiles y naturales"
                          />
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Textarea
                            value={nuevaVentaja.descripcion}
                            onChange={(e) => setNuevaVentaja({ ...nuevaVentaja, descripcion: e.target.value })}
                            placeholder="Describe por qué esto es una ventaja..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Impacto</Label>
                          <div className="flex gap-2 mt-2">
                            {(['Alto', 'Medio', 'Bajo'] as const).map((nivel) => (
                              <Badge
                                key={nivel}
                                variant={nuevaVentaja.impacto === nivel ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setNuevaVentaja({ ...nuevaVentaja, impacto: nivel })}
                              >
                                {nivel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button onClick={handleAnadirVentaja} className="w-full">
                          Añadir ventaja
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Ventaja</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Impacto</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventajas.map((ventaja) => (
                        <TableRow key={ventaja.id}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          </TableCell>
                          <TableCell className="font-medium">{ventaja.ventaja}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {ventaja.descripcion}
                          </TableCell>
                          <TableCell>
                            <Badge className={getImpactoColor(ventaja.impacto)}>
                              {ventaja.impacto}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setVentajas(ventajas.filter(v => v.id !== ventaja.id));
                                toast({ title: 'Ventaja eliminada' });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECCIÓN 4: DESVENTAJAS/DEBILIDADES */}
          <TabsContent value="desventajas" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      Desventajas / Debilidades
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 font-medium">⚠️ CONFIDENCIAL - No exportar por defecto</span>
                    </CardDescription>
                  </div>
                  <Dialog open={dialogDesventajaOpen} onOpenChange={setDialogDesventajaOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir desventaja
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nueva desventaja</DialogTitle>
                        <DialogDescription>
                          Esta información es confidencial y no se exportará por defecto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Debilidad</Label>
                          <Input
                            value={nuevaDesventaja.debilidad}
                            onChange={(e) => setNuevaDesventaja({ ...nuevaDesventaja, debilidad: e.target.value })}
                            placeholder="Ej: Personaje secundario poco desarrollado"
                          />
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Textarea
                            value={nuevaDesventaja.descripcion}
                            onChange={(e) => setNuevaDesventaja({ ...nuevaDesventaja, descripcion: e.target.value })}
                            placeholder="Describe la debilidad..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Impacto</Label>
                          <div className="flex gap-2 mt-2">
                            {(['Alto', 'Medio', 'Bajo'] as const).map((nivel) => (
                              <Badge
                                key={nivel}
                                variant={nuevaDesventaja.impacto === nivel ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setNuevaDesventaja({ ...nuevaDesventaja, impacto: nivel })}
                              >
                                {nivel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button onClick={handleAnadirDesventaja} className="w-full">
                          Añadir desventaja
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Debilidad</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Impacto</TableHead>
                        <TableHead>Incluir en dossier</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {desventajas.map((desventaja) => (
                        <TableRow key={desventaja.id}>
                          <TableCell>
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          </TableCell>
                          <TableCell className="font-medium">{desventaja.debilidad}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {desventaja.descripcion}
                          </TableCell>
                          <TableCell>
                            <Badge className={getImpactoColor(desventaja.impacto)}>
                              {desventaja.impacto}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={desventaja.incluirEnDossier}
                              onCheckedChange={(checked) => {
                                setDesventajas(desventajas.map(d => 
                                  d.id === desventaja.id 
                                    ? { ...d, incluirEnDossier: checked as boolean }
                                    : d
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDesventajas(desventajas.filter(d => d.id !== desventaja.id));
                                toast({ title: 'Desventaja eliminada' });
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECCIÓN 5: PROPUESTAS DE MEJORA */}
          <TabsContent value="propuestas" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Propuestas de Mejora
                    </CardTitle>
                    <CardDescription>
                      Sugerencias para optimizar el guión
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Implementar sugerencias IA
                    </Button>
                    <Dialog open={dialogPropuestaOpen} onOpenChange={setDialogPropuestaOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Añadir propuesta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nueva propuesta de mejora</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Descripción</Label>
                            <Textarea
                              value={nuevaPropuesta.descripcion}
                              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, descripcion: e.target.value })}
                              placeholder="Describe la propuesta de mejora..."
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label>Página recomendada (opcional)</Label>
                            <Input
                              type="number"
                              value={nuevaPropuesta.paginaRecomendada || ''}
                              onChange={(e) => setNuevaPropuesta({ ...nuevaPropuesta, paginaRecomendada: parseInt(e.target.value) || 0 })}
                              placeholder="Ej: 45"
                            />
                          </div>
                          <Button onClick={handleAnadirPropuesta} className="w-full">
                            Añadir propuesta
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {propuestasMejora.map((propuesta, index) => (
                    <div key={propuesta.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{propuesta.descripcion}</p>
                        {propuesta.paginaRecomendada > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Página recomendada: {propuesta.paginaRecomendada}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toast({ title: 'Funcionalidad en desarrollo' });
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPropuestasMejora(propuestasMejora.filter(p => p.id !== propuesta.id));
                            toast({ title: 'Propuesta eliminada' });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {propuestasMejora.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay propuestas de mejora todavía</p>
                      <p className="text-sm">Añade sugerencias para optimizar el guión</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Botón Flotante Siguiente */}
      <div className="fixed bottom-8 right-8 z-20">
        <Button
          size="lg"
          onClick={() => navigate('/analisis', { state: { analisis } })}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          Siguiente: Personajes
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
