import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin,
  Upload,
  Edit2,
  Trash2,
  Camera,
  Filter,
  Grid3x3,
  Table as TableIcon,
  Map,
  Sun,
  Moon,
  Home,
  Building2,
  Trees,
  Warehouse,
  Download,
  Calendar
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion, Localizacion } from '@/types/analisisGuion';

interface LocalizacionExtendida extends Localizacion {
  foto_referencia?: string;
  coste_estimado?: number;
  contacto_direccion?: string;
  notas_produccion_detalladas?: string;
}

interface DiaRodaje {
  dia: number;
  localizaciones: Array<{
    localizacion: string;
    escenas: number[];
  }>;
}

type VistaActual = 'cards' | 'tabla' | 'mapa';
type FiltroTipo = 'Todas' | 'INT' | 'EXT';
type FiltroMomento = 'Todos' | 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER';
type AgruparPor = 'ninguno' | 'tipo' | 'complejidad' | 'dias';

export default function Localizaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados
  const [localizaciones, setLocalizaciones] = useState<LocalizacionExtendida[]>(
    analisis?.localizaciones?.map(l => ({
      ...l,
      notas_produccion_detalladas: '',
      coste_estimado: 0,
      contacto_direccion: ''
    })) || []
  );

  const [vistaActual, setVistaActual] = useState<VistaActual>('tabla');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('Todas');
  const [filtroMomento, setFiltroMomento] = useState<FiltroMomento>('Todos');
  const [agruparPor, setAgruparPor] = useState<AgruparPor>('ninguno');
  const [localizacionSeleccionada, setLocalizacionSeleccionada] = useState<LocalizacionExtendida | null>(null);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [diasRodaje, setDiasRodaje] = useState<DiaRodaje[]>([]);

  // Cálculos
  const conteosPorTipo = useMemo(() => {
    return {
      INT: localizaciones.filter(l => l.tipo === 'INT').length,
      EXT: localizaciones.filter(l => l.tipo === 'EXT').length,
    };
  }, [localizaciones]);

  const totalDias = useMemo(() => {
    return localizaciones.reduce((sum, l) => sum + l.dias_rodaje_estimados, 0);
  }, [localizaciones]);

  const localizacionesFiltradas = useMemo(() => {
    let resultado = localizaciones;

    // Filtro por tipo
    if (filtroTipo !== 'Todas') {
      resultado = resultado.filter(l => l.tipo === filtroTipo);
    }

    // Filtro por momento
    if (filtroMomento !== 'Todos') {
      resultado = resultado.filter(l => l.momento_dia === filtroMomento);
    }

    return resultado;
  }, [localizaciones, filtroTipo, filtroMomento]);

  const localizacionesAgrupadas = useMemo(() => {
    if (agruparPor === 'ninguno') return null;

    const grupos: { [key: string]: LocalizacionExtendida[] } = {};

    localizacionesFiltradas.forEach(loc => {
      let key = '';
      if (agruparPor === 'tipo') key = loc.tipo;
      if (agruparPor === 'complejidad') key = loc.complejidad;
      if (agruparPor === 'dias') key = `${loc.dias_rodaje_estimados} días`;

      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(loc);
    });

    return grupos;
  }, [localizacionesFiltradas, agruparPor]);

  // Datos para gráficos
  const dataPieChart = [
    { name: 'Interiores', value: conteosPorTipo.INT, color: '#3b82f6' },
    { name: 'Exteriores', value: conteosPorTipo.EXT, color: '#22c55e' }
  ];

  const dataBarChart = localizaciones
    .sort((a, b) => b.dias_rodaje_estimados - a.dias_rodaje_estimados)
    .slice(0, 10)
    .map(l => ({
      nombre: l.nombre.length > 20 ? l.nombre.slice(0, 20) + '...' : l.nombre,
      dias: l.dias_rodaje_estimados
    }));

  // Handlers
  const handleEditarLocalizacion = (localizacion: LocalizacionExtendida) => {
    setLocalizacionSeleccionada(localizacion);
    setModalEdicion(true);
  };

  const handleEliminarLocalizacion = (nombre: string) => {
    setLocalizaciones(localizaciones.filter(l => l.nombre !== nombre));
    toast({
      title: 'Localización eliminada',
      description: `${nombre} ha sido eliminada`,
    });
  };

  const handleActualizarLocalizacion = (campo: keyof LocalizacionExtendida, valor: LocalizacionExtendida[keyof LocalizacionExtendida], nombre: string) => {
    setLocalizaciones(localizaciones.map(l => 
      l.nombre === nombre ? { ...l, [campo]: valor } : l
    ));
  };

  const handleGuardarEdicion = () => {
    if (!localizacionSeleccionada) return;
    
    setLocalizaciones(localizaciones.map(l => 
      l.nombre === localizacionSeleccionada.nombre ? localizacionSeleccionada : l
    ));
    
    setModalEdicion(false);
    toast({
      title: 'Cambios guardados',
      description: 'La localización ha sido actualizada',
    });
  };

  const handleCrearDiaRodaje = () => {
    const nuevoDia: DiaRodaje = {
      dia: diasRodaje.length + 1,
      localizaciones: []
    };
    setDiasRodaje([...diasRodaje, nuevoDia]);
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'INT' 
      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
      : 'bg-green-500 hover:bg-green-600 text-white';
  };

  const getMomentoColor = (momento: string) => {
    switch (momento) {
      case 'DÍA': return 'bg-yellow-400 text-black';
      case 'NOCHE': return 'bg-blue-900 text-white';
      case 'ATARDECER': return 'bg-orange-500 text-white';
      case 'AMANECER': return 'bg-pink-400 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'text-green-600 dark:text-green-400';
      case 'Media': return 'text-yellow-600 dark:text-yellow-400';
      case 'Alta': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

  const getLocalizacionIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('oficina') || n.includes('despacho')) return <Building2 className="w-4 h-4" />;
    if (n.includes('casa') || n.includes('hogar')) return <Home className="w-4 h-4" />;
    if (n.includes('bosque') || n.includes('parque')) return <Trees className="w-4 h-4" />;
    if (n.includes('almacén') || n.includes('nave')) return <Warehouse className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Localizaciones
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestión de localizaciones y planificación de rodaje
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Badges de totales */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">
              Total: {localizaciones.length}
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              INT: {conteosPorTipo.INT}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              EXT: {conteosPorTipo.EXT}
            </Badge>
            <Badge variant="outline">
              {totalDias} días totales
            </Badge>
          </div>

          {/* Filtros y vistas */}
          <div className="flex flex-col md:flex-row gap-3">
            <Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as VistaActual)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="cards">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="tabla">
                  <TableIcon className="w-4 h-4 mr-2" />
                  Tabla
                </TabsTrigger>
                <TabsTrigger value="mapa">
                  <Map className="w-4 h-4 mr-2" />
                  Visual
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="INT">Interiores</SelectItem>
                <SelectItem value="EXT">Exteriores</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroMomento} onValueChange={(v) => setFiltroMomento(v as FiltroMomento)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="DÍA">Día</SelectItem>
                <SelectItem value="NOCHE">Noche</SelectItem>
                <SelectItem value="ATARDECER">Atardecer</SelectItem>
                <SelectItem value="AMANECER">Amanecer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agruparPor} onValueChange={(v) => setAgruparPor(v as AgruparPor)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Sin agrupar</SelectItem>
                <SelectItem value="tipo">Por tipo</SelectItem>
                <SelectItem value="complejidad">Por complejidad</SelectItem>
                <SelectItem value="dias">Por días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* VISTA TABLA */}
        {vistaActual === 'tabla' && (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Localizaciones</CardTitle>
              <CardDescription>
                {localizacionesFiltradas.length} localizaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Momento</TableHead>
                        <TableHead>Escenas</TableHead>
                        <TableHead>Páginas</TableHead>
                        <TableHead>Días</TableHead>
                        <TableHead>Complejidad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(agruparPor === 'ninguno' ? localizacionesFiltradas : []).map((loc) => (
                        <TableRow key={loc.nombre} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getLocalizacionIcon(loc.nombre)}
                              <Input
                                value={loc.nombre}
                                onChange={(e) => handleActualizarLocalizacion('nombre', e.target.value, loc.nombre)}
                                className="border-0 shadow-none focus-visible:ring-1 h-8"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTipoColor(loc.tipo)}>
                              {loc.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={loc.momento_dia}
                              onValueChange={(v) => handleActualizarLocalizacion('momento_dia', v, loc.nombre)}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DÍA">
                                  <div className="flex items-center gap-2">
                                    <Sun className="w-3 h-3" />
                                    Día
                                  </div>
                                </SelectItem>
                                <SelectItem value="NOCHE">
                                  <div className="flex items-center gap-2">
                                    <Moon className="w-3 h-3" />
                                    Noche
                                  </div>
                                </SelectItem>
                                <SelectItem value="ATARDECER">Atardecer</SelectItem>
                                <SelectItem value="AMANECER">Amanecer</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {loc.escenas.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{loc.paginas_totales}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={loc.dias_rodaje_estimados}
                              onChange={(e) => handleActualizarLocalizacion('dias_rodaje_estimados', Number(e.target.value), loc.nombre)}
                              className="w-16 h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={loc.complejidad}
                              onValueChange={(v) => handleActualizarLocalizacion('complejidad', v, loc.nombre)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Baja">Baja</SelectItem>
                                <SelectItem value="Media">Media</SelectItem>
                                <SelectItem value="Alta">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditarLocalizacion(loc)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toast({ title: 'Funcionalidad próximamente' })}
                              >
                                <Camera className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEliminarLocalizacion(loc.nombre)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Vista agrupada */}
                  {agruparPor !== 'ninguno' && localizacionesAgrupadas && (
                    <div className="space-y-6 mt-6">
                      {Object.entries(localizacionesAgrupadas).map(([grupo, locs]) => (
                        <div key={grupo}>
                          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            {grupo}
                            <Badge variant="outline">{locs.length}</Badge>
                          </h3>
                          <Table>
                            <TableBody>
                              {locs.map((loc) => (
                                <TableRow key={loc.nombre} className="hover:bg-muted/50">
                                  <TableCell className="w-[250px] font-medium">
                                    <div className="flex items-center gap-2">
                                      {getLocalizacionIcon(loc.nombre)}
                                      {loc.nombre}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getTipoColor(loc.tipo)}>{loc.tipo}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getMomentoColor(loc.momento_dia)} variant="outline">
                                      {loc.momento_dia}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{loc.escenas.length} escenas</Badge>
                                  </TableCell>
                                  <TableCell>{loc.paginas_totales} págs</TableCell>
                                  <TableCell>{loc.dias_rodaje_estimados} días</TableCell>
                                  <TableCell>
                                    <span className={getComplejidadColor(loc.complejidad)}>
                                      {loc.complejidad}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditarLocalizacion(loc)}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* VISTA CARDS */}
        {vistaActual === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localizacionesFiltradas.map((loc) => (
              <Card key={loc.nombre} className="hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {getLocalizacionIcon(loc.nombre)}
                      <CardTitle className="text-lg">{loc.nombre}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getTipoColor(loc.tipo)}>{loc.tipo}</Badge>
                    <Badge className={getMomentoColor(loc.momento_dia)} variant="outline">
                      {loc.momento_dia}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Foto placeholder */}
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group/foto">
                    {loc.foto_referencia ? (
                      <img src={loc.foto_referencia} alt={loc.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-muted-foreground" />
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

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {loc.descripcion}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Escenas</p>
                      <p className="font-bold">{loc.escenas.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Páginas</p>
                      <p className="font-bold">{loc.paginas_totales}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Días</p>
                      <p className="font-bold">{loc.dias_rodaje_estimados}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Complejidad:</span>
                    <Badge variant="outline" className={getComplejidadColor(loc.complejidad)}>
                      {loc.complejidad}
                    </Badge>
                  </div>

                  {loc.necesidades_especiales.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Necesidades especiales:</p>
                      <div className="flex flex-wrap gap-1">
                        {loc.necesidades_especiales.slice(0, 3).map((need, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                        {loc.necesidades_especiales.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{loc.necesidades_especiales.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditarLocalizacion(loc)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminarLocalizacion(loc.nombre)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* VISTA VISUAL */}
        {vistaActual === 'mapa' && (
          <div className="space-y-6">
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución INT/EXT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataPieChart}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dataPieChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Días por Localización (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataBarChart} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          dataKey="nombre" 
                          type="category" 
                          width={120}
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="dias" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agrupación para rodaje */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agrupación para Rodaje</span>
                  <Button size="sm" onClick={handleCrearDiaRodaje}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Crear día de rodaje
                  </Button>
                </CardTitle>
                <CardDescription>
                  Organiza las localizaciones en días de rodaje
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diasRodaje.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No hay días de rodaje creados
                    </p>
                    <Button onClick={handleCrearDiaRodaje}>
                      Crear primer día de rodaje
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {diasRodaje.map((dia) => (
                      <Card key={dia.dia}>
                        <CardHeader>
                          <CardTitle className="text-lg">Día {dia.dia}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {dia.localizaciones.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Arrastra localizaciones aquí
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {dia.localizaciones.map((loc, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                                  <MapPin className="w-4 h-4" />
                                  <span className="font-medium">{loc.localizacion}</span>
                                  <Badge variant="outline">
                                    Esc. {loc.escenas.join(', ')}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navegación inferior */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/creativa/personajes', { state: { analisis } })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Personajes
          </Button>
          <Button onClick={() => toast({ title: 'Siguiente sección en construcción' })}>
            Siguiente: Desglose
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>

      {/* MODAL DE EDICIÓN */}
      <Dialog open={modalEdicion} onOpenChange={setModalEdicion}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Localización</DialogTitle>
            <DialogDescription>
              Información detallada y notas de producción
            </DialogDescription>
          </DialogHeader>

          {localizacionSeleccionada && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre completo</label>
                  <Input
                    value={localizacionSeleccionada.nombre}
                    onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, nombre: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Descripción detallada</label>
                  <Textarea
                    value={localizacionSeleccionada.descripcion}
                    onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, descripcion: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={localizacionSeleccionada.tipo}
                      onValueChange={(v: 'INT' | 'EXT') => setLocalizacionSeleccionada({ ...localizacionSeleccionada, tipo: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INT">Interior</SelectItem>
                        <SelectItem value="EXT">Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Momento del día</label>
                    <Select
                      value={localizacionSeleccionada.momento_dia}
                      onValueChange={(v: 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER') => setLocalizacionSeleccionada({ ...localizacionSeleccionada, momento_dia: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DÍA">Día</SelectItem>
                        <SelectItem value="NOCHE">Noche</SelectItem>
                        <SelectItem value="ATARDECER">Atardecer</SelectItem>
                        <SelectItem value="AMANECER">Amanecer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Necesidades especiales</label>
                  <Textarea
                    value={localizacionSeleccionada.necesidades_especiales.join('\n')}
                    onChange={(e) => setLocalizacionSeleccionada({ 
                      ...localizacionSeleccionada, 
                      necesidades_especiales: e.target.value.split('\n').filter(Boolean) 
                    })}
                    rows={3}
                    className="mt-1"
                    placeholder="Una necesidad por línea..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notas de producción</label>
                  <Textarea
                    value={localizacionSeleccionada.notas_produccion_detalladas}
                    onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, notas_produccion_detalladas: e.target.value })}
                    rows={4}
                    className="mt-1"
                    placeholder="Detalles adicionales, consideraciones..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Coste estimado (€)</label>
                    <Input
                      type="number"
                      value={localizacionSeleccionada.coste_estimado}
                      onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, coste_estimado: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Días de rodaje</label>
                    <Input
                      type="number"
                      value={localizacionSeleccionada.dias_rodaje_estimados}
                      onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, dias_rodaje_estimados: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Contacto / Dirección</label>
                  <Textarea
                    value={localizacionSeleccionada.contacto_direccion}
                    onChange={(e) => setLocalizacionSeleccionada({ ...localizacionSeleccionada, contacto_direccion: e.target.value })}
                    rows={2}
                    className="mt-1"
                    placeholder="Persona de contacto, dirección, teléfono..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleGuardarEdicion} className="flex-1">
                    Guardar cambios
                  </Button>
                  <Button variant="outline" onClick={() => setModalEdicion(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
