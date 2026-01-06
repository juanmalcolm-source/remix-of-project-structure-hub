import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Film,
  Users,
  MapPin,
  Zap,
  Clock,
  Target
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
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface FactorEncarecimiento {
  id: string;
  factor: string;
  impacto: number;
  solucion: string;
}

interface FactorFacilitador {
  id: string;
  factor: string;
  ahorro: number;
  notas: string;
}

interface ProyectoComparable {
  id: string;
  nombre: string;
  presupuesto: string;
  resultado: string;
}

interface ScoreDimension {
  nombre: string;
  puntuacion: number;
  maximo: number;
  icon: any;
}

export default function Viabilidad() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Estados para scores
  const [scores, setScores] = useState<ScoreDimension[]>([
    { nombre: 'Simplicidad narrativa', puntuacion: 8, maximo: 10, icon: Film },
    { nombre: 'Localizaciones accesibles', puntuacion: 6, maximo: 10, icon: MapPin },
    { nombre: 'Elenco manejable', puntuacion: 9, maximo: 10, icon: Users },
    { nombre: 'Efectos especiales', puntuacion: 10, maximo: 10, icon: Zap },
    { nombre: 'Presupuesto vs complejidad', puntuacion: 5, maximo: 10, icon: DollarSign },
  ]);

  const [factoresEncarecimiento, setFactoresEncarecimiento] = useState<FactorEncarecimiento[]>([
    {
      id: '1',
      factor: '5 localizaciones exteriores',
      impacto: 50000,
      solucion: 'Reducir a 3 o buscar interiores'
    },
    {
      id: '2',
      factor: '15 días de rodaje',
      impacto: 120000,
      solucion: 'Optimizar plan de rodaje'
    }
  ]);

  const [factoresFacilitadores, setFactoresFacilitadores] = useState<FactorFacilitador[]>([
    {
      id: '1',
      factor: 'Pocos personajes',
      ahorro: 30000,
      notas: 'Reduce costes de casting'
    },
    {
      id: '2',
      factor: 'Sin efectos especiales',
      ahorro: 80000,
      notas: 'Postproducción simple'
    }
  ]);

  const [proyectosComparables, setProyectosComparables] = useState<ProyectoComparable[]>([
    {
      id: '1',
      nombre: 'Film similar A',
      presupuesto: '€900k',
      resultado: 'Éxito festival'
    },
    {
      id: '2',
      nombre: 'Film similar B',
      presupuesto: '€1.2M',
      resultado: 'Distribución nacional'
    }
  ]);

  // Cálculos
  const scoreGlobal = useMemo(() => {
    const suma = scores.reduce((acc, s) => acc + s.puntuacion, 0);
    const maximo = scores.reduce((acc, s) => acc + s.maximo, 0);
    return (suma / maximo) * 10;
  }, [scores]);

  const nivelComplejidad = useMemo(() => {
    if (scoreGlobal >= 8) return { texto: 'BAJA COMPLEJIDAD', color: 'text-green-600 dark:text-green-400' };
    if (scoreGlobal >= 6) return { texto: 'MEDIA COMPLEJIDAD', color: 'text-yellow-600 dark:text-yellow-400' };
    return { texto: 'ALTA COMPLEJIDAD', color: 'text-red-600 dark:text-red-400' };
  }, [scoreGlobal]);

  const presupuestoRecomendado = useMemo(() => {
    const totalEncarecimiento = factoresEncarecimiento.reduce((sum, f) => sum + f.impacto, 0);
    const totalAhorro = factoresFacilitadores.reduce((sum, f) => sum + f.ahorro, 0);
    const base = 800000;
    const estimado = base + totalEncarecimiento - totalAhorro;
    
    if (estimado < 800000) return 'BAJO';
    if (estimado < 1500000) return 'MEDIO';
    return 'ALTO';
  }, [factoresEncarecimiento, factoresFacilitadores]);

  // Datos para gráfico de dona
  const dataDesglose = [
    { name: 'Personal artístico', value: 30, color: '#3b82f6' },
    { name: 'Equipo técnico', value: 25, color: '#8b5cf6' },
    { name: 'Localizaciones', value: 15, color: '#22c55e' },
    { name: 'Postproducción', value: 20, color: '#f59e0b' },
    { name: 'Otros', value: 10, color: '#6b7280' }
  ];

  // Handlers
  const handleAddFactorEncarecimiento = () => {
    const nuevo: FactorEncarecimiento = {
      id: Date.now().toString(),
      factor: 'Nuevo factor',
      impacto: 0,
      solucion: 'Solución alternativa'
    };
    setFactoresEncarecimiento([...factoresEncarecimiento, nuevo]);
  };

  const handleDeleteFactorEncarecimiento = (id: string) => {
    setFactoresEncarecimiento(factoresEncarecimiento.filter(f => f.id !== id));
  };

  const handleAddFactorFacilitador = () => {
    const nuevo: FactorFacilitador = {
      id: Date.now().toString(),
      factor: 'Nuevo factor',
      ahorro: 0,
      notas: 'Notas'
    };
    setFactoresFacilitadores([...factoresFacilitadores, nuevo]);
  };

  const handleDeleteFactorFacilitador = (id: string) => {
    setFactoresFacilitadores(factoresFacilitadores.filter(f => f.id !== id));
  };

  const handleAddProyecto = () => {
    const nuevo: ProyectoComparable = {
      id: Date.now().toString(),
      nombre: 'Proyecto similar',
      presupuesto: '€0',
      resultado: 'Resultado'
    };
    setProyectosComparables([...proyectosComparables, nuevo]);
  };

  const handleDeleteProyecto = (id: string) => {
    setProyectosComparables(proyectosComparables.filter(p => p.id !== id));
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted pb-24">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Viabilidad de Producción
              </h1>
              <p className="text-sm text-muted-foreground">
                Análisis de factibilidad y estimación presupuestaria
              </p>
            </div>
            
            <Badge variant="outline" className={`text-lg px-4 py-2 ${nivelComplejidad.color}`}>
              {nivelComplejidad.texto}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* SECCIÓN 1: PRODUCIBILITY SCORE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              Producibility Score Desglosado
            </CardTitle>
            <CardDescription>
              Evaluación de diferentes dimensiones de producibilidad
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dimensiones individuales */}
            {scores.map((score, index) => {
              const Icon = score.icon;
              const porcentaje = (score.puntuacion / score.maximo) * 100;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{score.nombre}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {score.puntuacion}/{score.maximo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={porcentaje} className="flex-1" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {porcentaje.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Score global */}
            <div className="pt-6 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Score Global</span>
                <span className="text-2xl font-bold text-primary">
                  {scoreGlobal.toFixed(1)}/10
                </span>
              </div>
              <Progress value={scoreGlobal * 10} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Nivel de complejidad: <span className={`font-semibold ${nivelComplejidad.color}`}>
                  {nivelComplejidad.texto}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 2 y 3: FACTORES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FACTORES QUE ENCARECEN */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-red-600 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Factores que Encarecen
                </div>
                <Button variant="outline" size="sm" onClick={handleAddFactorEncarecimiento}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead>Solución</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoresEncarecimiento.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Input
                          value={factor.factor}
                          onChange={(e) => {
                            setFactoresEncarecimiento(factoresEncarecimiento.map(f =>
                              f.id === factor.id ? { ...f, factor: e.target.value } : f
                            ));
                          }}
                          className="h-8 border-0 shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={factor.impacto}
                          onChange={(e) => {
                            setFactoresEncarecimiento(factoresEncarecimiento.map(f =>
                              f.id === factor.id ? { ...f, impacto: Number(e.target.value) } : f
                            ));
                          }}
                          className="h-8 w-24"
                          placeholder="€"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={factor.solucion}
                          onChange={(e) => {
                            setFactoresEncarecimiento(factoresEncarecimiento.map(f =>
                              f.id === factor.id ? { ...f, solucion: e.target.value } : f
                            ));
                          }}
                          className="h-8 border-0 shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteFactorEncarecimiento(factor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total impacto:</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    +{formatCurrency(factoresEncarecimiento.reduce((sum, f) => sum + f.impacto, 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FACTORES QUE FACILITAN */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-green-600 dark:text-green-400">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Factores que Facilitan
                </div>
                <Button variant="outline" size="sm" onClick={handleAddFactorFacilitador}>
                  <Plus className="w-4 h-4 mr-1" />
                  Añadir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factor</TableHead>
                    <TableHead>Ahorro</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoresFacilitadores.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Input
                          value={factor.factor}
                          onChange={(e) => {
                            setFactoresFacilitadores(factoresFacilitadores.map(f =>
                              f.id === factor.id ? { ...f, factor: e.target.value } : f
                            ));
                          }}
                          className="h-8 border-0 shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={factor.ahorro}
                          onChange={(e) => {
                            setFactoresFacilitadores(factoresFacilitadores.map(f =>
                              f.id === factor.id ? { ...f, ahorro: Number(e.target.value) } : f
                            ));
                          }}
                          className="h-8 w-24"
                          placeholder="€"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={factor.notas}
                          onChange={(e) => {
                            setFactoresFacilitadores(factoresFacilitadores.map(f =>
                              f.id === factor.id ? { ...f, notas: e.target.value } : f
                            ));
                          }}
                          className="h-8 border-0 shadow-none focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteFactorFacilitador(factor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total ahorro:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    -{formatCurrency(factoresFacilitadores.reduce((sum, f) => sum + f.ahorro, 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECCIÓN 4: ESTIMACIÓN PRESUPUESTARIA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Estimación Presupuestaria
            </CardTitle>
            <CardDescription>
              Rangos de presupuesto y desglose estimado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cards de rangos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={`cursor-pointer transition-all ${presupuestoRecomendado === 'BAJO' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-sm text-green-600 dark:text-green-400">BAJO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">€500k - €800k</p>
                  <p className="text-xs text-muted-foreground mt-2">Producción indie, recursos limitados</p>
                  {presupuestoRecomendado === 'BAJO' && (
                    <Badge className="mt-2 bg-primary">Recomendado</Badge>
                  )}
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-all ${presupuestoRecomendado === 'MEDIO' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-sm text-yellow-600 dark:text-yellow-400">MEDIO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">€800k - €1.5M</p>
                  <p className="text-xs text-muted-foreground mt-2">Producción profesional estándar</p>
                  {presupuestoRecomendado === 'MEDIO' && (
                    <Badge className="mt-2 bg-primary">Recomendado</Badge>
                  )}
                </CardContent>
              </Card>

              <Card className={`cursor-pointer transition-all ${presupuestoRecomendado === 'ALTO' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-sm text-red-600 dark:text-red-400">ALTO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">€1.5M - €3M</p>
                  <p className="text-xs text-muted-foreground mt-2">Producción compleja, alta calidad</p>
                  {presupuestoRecomendado === 'ALTO' && (
                    <Badge className="mt-2 bg-primary">Recomendado</Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de desglose */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <h3 className="font-semibold mb-4">Desglose estimado del presupuesto</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataDesglose}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {dataDesglose.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Distribución por categoría</h3>
                {dataDesglose.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{item.value}%</p>
                      <p className="text-xs text-muted-foreground">
                        {presupuestoRecomendado === 'BAJO' && formatCurrency(650000 * item.value / 100)}
                        {presupuestoRecomendado === 'MEDIO' && formatCurrency(1150000 * item.value / 100)}
                        {presupuestoRecomendado === 'ALTO' && formatCurrency(2250000 * item.value / 100)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 5: COMPARATIVA CON PROYECTOS SIMILARES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                Comparativa con Proyectos Similares
              </div>
              <Button variant="outline" size="sm" onClick={handleAddProyecto}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir proyecto
              </Button>
            </CardTitle>
            <CardDescription>
              Benchmark con producciones comparables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectosComparables.map((proyecto) => (
                  <TableRow key={proyecto.id}>
                    <TableCell>
                      <Input
                        value={proyecto.nombre}
                        onChange={(e) => {
                          setProyectosComparables(proyectosComparables.map(p =>
                            p.id === proyecto.id ? { ...p, nombre: e.target.value } : p
                          ));
                        }}
                        className="border-0 shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={proyecto.presupuesto}
                        onChange={(e) => {
                          setProyectosComparables(proyectosComparables.map(p =>
                            p.id === proyecto.id ? { ...p, presupuesto: e.target.value } : p
                          ));
                        }}
                        className="w-32 border-0 shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={proyecto.resultado}
                        onChange={(e) => {
                          setProyectosComparables(proyectosComparables.map(p =>
                            p.id === proyecto.id ? { ...p, resultado: e.target.value } : p
                          ));
                        }}
                        className="border-0 shadow-none focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProyecto(proyecto.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CALL TO ACTION */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-3xl font-bold">¿Listo para planificar la producción?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Has completado el análisis creativo del guión. Ahora es momento de pasar a la fase de producción 
              donde planificarás el desglose de producción, el plan de rodaje y el presupuesto detallado.
            </p>
            <Button size="lg" className="mt-4" onClick={() => toast({ title: 'Sección de producción próximamente' })}>
              Ir a Parte Producción
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Navegación inferior */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/creativa/localizaciones', { state: { analisis } })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Localizaciones
          </Button>
          <Button onClick={() => navigate('/creativa/overview', { state: { analisis } })}>
            Volver a Overview
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
