import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Users, 
  MapPin, 
  Film, 
  Calendar,
  Info,
  Clapperboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisGuion } from '@/types/analisisGuion';

export default function Analisis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Obtener análisis del state de navegación
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [activeTab, setActiveTab] = useState('general');

  // Si no hay análisis, redirigir
  if (!analisis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Film className="w-16 h-16 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">No hay análisis disponible</h2>
            <p className="text-muted-foreground">
              Primero debes subir y analizar un guión
            </p>
            <Button onClick={() => navigate('/upload')}>
              Ir a subir guión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(analisis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis-${analisis.informacion_general.titulo.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportado',
      description: 'El análisis se ha descargado como JSON',
    });
  };

  const handleExportCSV = () => {
    // CSV simplificado con personajes
    const headers = 'Nombre,Categoría,Género,Edad,Días Rodaje,Importancia\n';
    const rows = analisis.personajes.map(p => 
      `"${p.nombre}","${p.categoria}","${p.genero}","${p.edad_aproximada}",${p.dias_rodaje_estimados},"${p.importancia_trama}"`
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personajes-${analisis.informacion_general.titulo.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportado',
      description: 'Los personajes se han descargado como CSV',
    });
  };

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/upload')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {analisis.informacion_general.titulo}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {analisis.informacion_general.genero} • {analisis.informacion_general.duracion_estimada_minutos} min
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Personajes</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analisis.personajes.length}</div>
              <p className="text-xs text-muted-foreground">
                {analisis.resumen_produccion.total_personajes.protagonistas} protagonistas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Localizaciones</CardTitle>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analisis.localizaciones.length}</div>
              <p className="text-xs text-muted-foreground">
                {analisis.resumen_produccion.total_localizaciones.interiores} INT / {analisis.resumen_produccion.total_localizaciones.exteriores} EXT
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Secuencias</CardTitle>
              <Film className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analisis.desglose_secuencias.length}</div>
              <p className="text-xs text-muted-foreground">
                {analisis.informacion_general.paginas_totales} páginas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Días de Rodaje</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analisis.resumen_produccion.dias_rodaje.estimacion_recomendada}
              </div>
              <p className="text-xs text-muted-foreground">
                {analisis.resumen_produccion.dias_rodaje.estimacion_minima}-{analisis.resumen_produccion.dias_rodaje.estimacion_maxima} días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              <Info className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="personajes">
              <Users className="w-4 h-4 mr-2" />
              Personajes
            </TabsTrigger>
            <TabsTrigger value="localizaciones">
              <MapPin className="w-4 h-4 mr-2" />
              Localizaciones
            </TabsTrigger>
            <TabsTrigger value="secuencias">
              <Film className="w-4 h-4 mr-2" />
              Secuencias
            </TabsTrigger>
            <TabsTrigger value="produccion">
              <Clapperboard className="w-4 h-4 mr-2" />
              Producción
            </TabsTrigger>
          </TabsList>

          {/* Información General */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Título</p>
                    <p className="text-lg">{analisis.informacion_general.titulo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Género</p>
                    <p className="text-lg">{analisis.informacion_general.genero}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duración Estimada</p>
                    <p className="text-lg">{analisis.informacion_general.duracion_estimada_minutos} minutos</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Páginas</p>
                    <p className="text-lg">{analisis.informacion_general.paginas_totales}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Páginas de Diálogo</p>
                    <p className="text-lg">{analisis.informacion_general.paginas_dialogo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Páginas de Acción</p>
                    <p className="text-lg">{analisis.informacion_general.paginas_accion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personajes */}
          <TabsContent value="personajes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Personajes ({analisis.personajes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analisis.personajes.map((personaje, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{personaje.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{personaje.descripcion}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{personaje.categoria}</Badge>
                          <Badge className={getComplejidadColor(personaje.importancia_trama)}>
                            {personaje.importancia_trama}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Género:</span> {personaje.genero}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Edad:</span> {personaje.edad_aproximada}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Escenas:</span> {personaje.escenas_aparicion.length}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Días rodaje:</span> {personaje.dias_rodaje_estimados}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Localizaciones */}
          <TabsContent value="localizaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Localizaciones ({analisis.localizaciones.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analisis.localizaciones.map((loc, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{loc.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{loc.descripcion}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{loc.tipo}</Badge>
                          <Badge variant="outline">{loc.momento_dia}</Badge>
                          <Badge className={getComplejidadColor(loc.complejidad)}>
                            {loc.complejidad}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Escenas:</span> {loc.escenas.length}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Páginas:</span> {loc.paginas_totales}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Días rodaje:</span> {loc.dias_rodaje_estimados}
                        </div>
                      </div>
                      {loc.necesidades_especiales.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-1">Necesidades especiales:</p>
                          <div className="flex flex-wrap gap-1">
                            {loc.necesidades_especiales.map((need, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Secuencias */}
          <TabsContent value="secuencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Desglose de Secuencias ({analisis.desglose_secuencias.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analisis.desglose_secuencias.map((sec) => (
                    <div
                      key={sec.numero_secuencia}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{sec.numero_escena}</Badge>
                            <h3 className="font-semibold">{sec.encabezado}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {sec.paginas_octavos} páginas
                          </p>
                        </div>
                        <Badge className={getComplejidadColor(sec.complejidad_rodaje)}>
                          {sec.complejidad_rodaje}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {sec.personajes.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Personajes:</p>
                            <div className="flex flex-wrap gap-1">
                              {sec.personajes.map((p, i) => (
                                <Badge key={i} variant="secondary">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {sec.attrezzo.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Attrezzo:</p>
                            <div className="flex flex-wrap gap-1">
                              {sec.attrezzo.map((a, i) => (
                                <Badge key={i} variant="outline">{a}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {sec.vestuario.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Vestuario:</p>
                            <div className="flex flex-wrap gap-1">
                              {sec.vestuario.map((v, i) => (
                                <Badge key={i} variant="outline">{v}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {sec.vehiculos && sec.vehiculos.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Vehículos:</p>
                            <div className="flex flex-wrap gap-1">
                              {sec.vehiculos.map((v, i) => (
                                <Badge key={i} variant="outline">{v}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resumen de Producción */}
          <TabsContent value="produccion" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Personajes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Protagonistas:</span>
                    <Badge>{analisis.resumen_produccion.total_personajes.protagonistas}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Principales:</span>
                    <Badge>{analisis.resumen_produccion.total_personajes.principales}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Secundarios:</span>
                    <Badge>{analisis.resumen_produccion.total_personajes.secundarios}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Figuración:</span>
                    <Badge>{analisis.resumen_produccion.total_personajes.figuracion}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Localizaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Interiores:</span>
                    <Badge>{analisis.resumen_produccion.total_localizaciones.interiores}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Exteriores:</span>
                    <Badge>{analisis.resumen_produccion.total_localizaciones.exteriores}</Badge>
                  </div>
                  <div className="flex justify-between pt-4">
                    <span className="font-semibold">Complejidad General:</span>
                    <Badge className={getComplejidadColor(analisis.resumen_produccion.complejidad_general)}>
                      {analisis.resumen_produccion.complejidad_general}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estimación de Días de Rodaje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mínima:</span>
                    <Badge variant="outline">{analisis.resumen_produccion.dias_rodaje.estimacion_minima} días</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recomendada:</span>
                    <Badge className="bg-primary">{analisis.resumen_produccion.dias_rodaje.estimacion_recomendada} días</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Máxima:</span>
                    <Badge variant="outline">{analisis.resumen_produccion.dias_rodaje.estimacion_maxima} días</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
