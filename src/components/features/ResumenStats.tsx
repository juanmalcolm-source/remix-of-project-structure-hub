import { Users, MapPin, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface ResumenStatsProps {
  analisis: AnalisisGuion;
}

export default function ResumenStats({ analisis }: ResumenStatsProps) {
  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'Alta': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const stats = [
    {
      title: 'Total Personajes',
      value: analisis.personajes.length,
      icon: Users,
      description: `${analisis.resumen_produccion.total_personajes.protagonistas} protagonistas, ${analisis.resumen_produccion.total_personajes.principales} principales`,
      breakdown: [
        { label: 'Protagonistas', count: analisis.resumen_produccion.total_personajes.protagonistas },
        { label: 'Principales', count: analisis.resumen_produccion.total_personajes.principales },
        { label: 'Secundarios', count: analisis.resumen_produccion.total_personajes.secundarios },
        { label: 'Figuración', count: analisis.resumen_produccion.total_personajes.figuracion },
      ]
    },
    {
      title: 'Localizaciones',
      value: analisis.localizaciones.length,
      icon: MapPin,
      description: `${analisis.resumen_produccion.total_localizaciones.interiores} interiores, ${analisis.resumen_produccion.total_localizaciones.exteriores} exteriores`,
      breakdown: [
        { label: 'Interiores', count: analisis.resumen_produccion.total_localizaciones.interiores },
        { label: 'Exteriores', count: analisis.resumen_produccion.total_localizaciones.exteriores },
      ]
    },
    {
      title: 'Días de Rodaje',
      value: analisis.resumen_produccion.dias_rodaje.estimacion_recomendada,
      icon: Calendar,
      description: `Rango: ${analisis.resumen_produccion.dias_rodaje.estimacion_minima}-${analisis.resumen_produccion.dias_rodaje.estimacion_maxima} días`,
      breakdown: [
        { label: 'Mínima', count: analisis.resumen_produccion.dias_rodaje.estimacion_minima },
        { label: 'Recomendada', count: analisis.resumen_produccion.dias_rodaje.estimacion_recomendada },
        { label: 'Máxima', count: analisis.resumen_produccion.dias_rodaje.estimacion_maxima },
      ]
    },
    {
      title: 'Complejidad',
      value: analisis.resumen_produccion.complejidad_general,
      icon: TrendingUp,
      description: 'Nivel de complejidad de producción',
      badge: true
    },
    {
      title: 'Duración Estimada',
      value: `${analisis.informacion_general.duracion_estimada_minutos} min`,
      icon: Clock,
      description: `${analisis.informacion_general.paginas_totales} páginas totales`,
      breakdown: [
        { label: 'Páginas de diálogo', count: analisis.informacion_general.paginas_dialogo },
        { label: 'Páginas de acción', count: analisis.informacion_general.paginas_accion },
      ]
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stat.badge ? (
                  <Badge className={getComplejidadColor(stat.value as string)}>
                    {stat.value}
                  </Badge>
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                
                {stat.breakdown && (
                  <div className="pt-2 space-y-1">
                    {stat.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
