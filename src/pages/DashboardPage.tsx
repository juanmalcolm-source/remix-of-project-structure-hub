import { useParams, useNavigate } from 'react-router-dom';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Landmark, FileText, Users, ListChecks, CalendarClock, Clock,
  Palette, Clapperboard, Wallet, Megaphone, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/hooks/useProject';
import { useDashboardData } from '@/hooks/useDashboard';
import CreativeLayout from '@/components/layout/CreativeLayout';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const { data: dash, isLoading } = useDashboardData(projectId);

  const diasRestantes = (fecha: string | null) => {
    if (!fecha) return null;
    return differenceInDays(new Date(fecha), new Date());
  };

  const sections = [
    { label: 'Creativa', desc: 'Análisis narrativo, personajes, viabilidad', icon: Palette, path: `/proyecto/${projectId}/overview`, color: 'text-violet-500' },
    { label: 'Producción', desc: 'Desglose, plan de rodaje, presupuesto', icon: Clapperboard, path: `/produccion/${projectId}/desglose`, color: 'text-orange-500' },
    { label: 'Financiación', desc: 'Incentivos fiscales, fuentes, simulador', icon: Wallet, path: `/financiacion/${projectId}/resumen`, color: 'text-emerald-500' },
    { label: 'Audiencias', desc: 'Segmentos, buyer personas, festivales', icon: Megaphone, path: `/audiencias/${projectId}/analisis`, color: 'text-blue-500' },
    { label: 'Convocatorias', desc: 'Biblioteca, calendario, workspace', icon: Landmark, path: `/convocatorias/${projectId}/biblioteca`, color: 'text-amber-600' },
  ];

  return (
    <CreativeLayout projectTitle={project?.title}>
      <PageHeader title="Dashboard" description="Vista general de tu proyecto" />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard icon={Landmark} label="Convocatorias activas" value={dash?.convocatoriasActivas ?? 0} />
            <KpiCard icon={FileText} label="Solicitudes en curso" value={dash?.solicitudesEnCurso ?? 0} />
            <KpiCard icon={Users} label="Buyer Personas" value={dash?.buyerPersonas ?? 0} />
            <KpiCard icon={ListChecks} label="Tareas pendientes" value={dash?.tareasPendientes ?? 0} />
            {dash?.proximoCierre ? (
              <Card className="col-span-2 stats-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <CalendarClock className="w-3.5 h-3.5" />Próximo cierre
                  </div>
                  <p className="font-semibold text-sm truncate">{dash.proximoCierre.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DaysBadge days={diasRestantes(dash.proximoCierre.fecha_cierre)} />
                    <span className="text-xs text-muted-foreground">{dash.proximoCierre.organismo}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="col-span-2 stats-card">
                <CardContent className="p-4 flex items-center justify-center text-sm text-muted-foreground">Sin cierres próximos</CardContent>
              </Card>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Acceso Rápido */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold">Acceso rápido</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {sections.map((s) => (
                  <Card key={s.label} className="cursor-pointer hover:border-accent/50 transition-all group" onClick={() => navigate(s.path)}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`mt-0.5 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{s.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Próximos Cierres */}
              {(dash?.proximosCierres?.length ?? 0) > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3">Próximos cierres</h2>
                  <Card>
                    <CardContent className="p-0 divide-y">
                      {dash!.proximosCierres.map((c) => {
                        const days = diasRestantes(c.fecha_cierre);
                        return (
                          <button key={c.id} onClick={() => navigate(`/convocatorias/${projectId}/biblioteca`)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{c.nombre}</p>
                              <p className="text-xs text-muted-foreground">{c.organismo}</p>
                            </div>
                            <DaysBadge days={days} />
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Actividad Reciente */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Actividad reciente</h2>
              {(dash?.actividad?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
              ) : (
                <div className="space-y-0 film-strip">
                  {dash!.actividad.map((a) => (
                    <div key={a.id + a.type} className="pl-4 py-2">
                      <div className="flex items-start gap-2">
                        <ActivityIcon type={a.type} />
                        <div className="min-w-0">
                          <p className="text-sm leading-snug">{a.label}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CreativeLayout>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card className="stats-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <Icon className="w-3.5 h-3.5" />{label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  const variant = days < 7 ? 'destructive' : days < 30 ? 'secondary' : 'outline';
  const className = days < 7 ? '' : days < 30 ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400' : '';
  return <Badge variant={variant} className={`text-xs whitespace-nowrap ${className}`}>{days} días</Badge>;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'convocatoria': return <Landmark className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />;
    case 'solicitud': return <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />;
    case 'tarea': return <ListChecks className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />;
  }
}
