import { useState } from 'react';
import { GripVertical, Users, Package, Shirt, Car, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Secuencia } from '@/types/analisisGuion';

interface SecuenciasTimelineProps {
  secuencias: Secuencia[];
}

export default function SecuenciasTimeline({ secuencias }: SecuenciasTimelineProps) {
  const [expandedSecuencia, setExpandedSecuencia] = useState<number | null>(null);

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'border-green-500/20 bg-green-500/5';
      case 'Media': return 'border-yellow-500/20 bg-yellow-500/5';
      case 'Alta': return 'border-red-500/20 bg-red-500/5';
      default: return 'border-muted';
    }
  };

  const getComplejidadBadgeColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalPaginas = secuencias.reduce((sum, sec) => sum + sec.paginas_octavos, 0);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div>
          <h3 className="font-semibold">Total de Secuencias</h3>
          <p className="text-sm text-muted-foreground">
            {secuencias.length} secuencias • {totalPaginas.toFixed(2)} páginas totales
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {secuencias.length}
        </Badge>
      </div>

      {/* Timeline de secuencias */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-4">
          {secuencias.map((secuencia) => {
            const isExpanded = expandedSecuencia === secuencia.numero_secuencia;
            
            return (
              <Card
                key={secuencia.numero_secuencia}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${getComplejidadColor(secuencia.complejidad_rodaje)}`}
                onClick={() => setExpandedSecuencia(isExpanded ? null : secuencia.numero_secuencia)}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="cursor-grab active:cursor-grabbing pt-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Título */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            #{secuencia.numero_escena}
                          </Badge>
                          <h4 className="font-semibold text-sm">
                            {secuencia.encabezado}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {secuencia.paginas_octavos} páginas
                        </p>
                      </div>
                      <Badge className={getComplejidadBadgeColor(secuencia.complejidad_rodaje)}>
                        {secuencia.complejidad_rodaje}
                      </Badge>
                    </div>

                    {/* Info básica siempre visible */}
                    <div className="flex flex-wrap gap-2">
                      {secuencia.personajes.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {secuencia.personajes.length} personajes
                          </span>
                        </div>
                      )}
                      {secuencia.attrezzo.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Package className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {secuencia.attrezzo.length} attrezzo
                          </span>
                        </div>
                      )}
                      {secuencia.vestuario.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Shirt className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {secuencia.vestuario.length} vestuario
                          </span>
                        </div>
                      )}
                      {secuencia.vehiculos && secuencia.vehiculos.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Car className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {secuencia.vehiculos.length} vehículos
                          </span>
                        </div>
                      )}
                      {secuencia.efectos_especiales && secuencia.efectos_especiales.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Sparkles className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {secuencia.efectos_especiales.length} efectos
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detalles expandidos */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t animate-fade-in">
                        {secuencia.personajes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              Personajes
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {secuencia.personajes.map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {secuencia.attrezzo.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 flex items-center gap-2">
                              <Package className="w-3 h-3" />
                              Attrezzo
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {secuencia.attrezzo.map((a, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {secuencia.vestuario.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 flex items-center gap-2">
                              <Shirt className="w-3 h-3" />
                              Vestuario
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {secuencia.vestuario.map((v, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {secuencia.vehiculos && secuencia.vehiculos.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 flex items-center gap-2">
                              <Car className="w-3 h-3" />
                              Vehículos
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {secuencia.vehiculos.map((v, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {secuencia.efectos_especiales && secuencia.efectos_especiales.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2 flex items-center gap-2">
                              <Sparkles className="w-3 h-3" />
                              Efectos Especiales
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {secuencia.efectos_especiales.map((e, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
