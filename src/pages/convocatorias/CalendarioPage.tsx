import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { useProject } from '@/hooks/useProject';
import ConvocatoriasLayout from '@/components/layout/ConvocatoriasLayout';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const AMBITO_COLORS: Record<string, string> = {
  estatal: 'bg-blue-500',
  autonomica: 'bg-purple-500',
  europea: 'bg-green-500',
  iberoamericana: 'bg-orange-500',
  privada: 'bg-muted-foreground',
};

const AMBITO_STYLES: Record<string, string> = {
  estatal: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  autonomica: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  europea: 'bg-green-500/10 text-green-600 border-green-500/30',
  iberoamericana: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  privada: 'bg-muted text-muted-foreground',
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function CalendarioPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const { data: convocatorias, isLoading } = useConvocatorias();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Map fecha_cierre to day numbers
  const eventsByDay = useMemo(() => {
    const map: Record<number, NonNullable<typeof convocatorias>> = {};
    (convocatorias ?? []).forEach(c => {
      if (!c.fecha_cierre) return;
      const d = new Date(c.fecha_cierre);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(c);
      }
    });
    return map;
  }, [convocatorias, year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const openDay = (day: number) => { setSelectedDay(day); setDialogOpen(true); };
  const selectedEvents = selectedDay ? eventsByDay[selectedDay] ?? [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <ConvocatoriasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Calendario de Convocatorias"
          description="Fechas de cierre de convocatorias."
        />

        {isLoading ? (
          <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-5 h-5" /></Button>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-display font-bold">{MONTH_NAMES[month]} {year}</h2>
                  <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-5 h-5" /></Button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {DAY_NAMES.map(d => (
                  <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
                {cells.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      'bg-card min-h-[80px] p-2 transition-colors',
                      day && 'cursor-pointer hover:bg-muted/50',
                      day && isToday(day) && 'bg-primary/5',
                    )}
                    onClick={() => day && eventsByDay[day] && openDay(day)}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          'text-sm',
                          isToday(day) && 'font-bold text-primary',
                          !isToday(day) && 'text-foreground',
                        )}>{day}</span>
                        {eventsByDay[day] && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {eventsByDay[day].slice(0, 3).map((ev, j) => (
                              <div key={j} className={cn('w-2 h-2 rounded-full', AMBITO_COLORS[ev.ambito] || 'bg-muted-foreground')} title={ev.nombre} />
                            ))}
                            {eventsByDay[day].length > 3 && <span className="text-xs text-muted-foreground">+{eventsByDay[day].length - 3}</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4">
                {Object.entries(AMBITO_COLORS).map(([ambito, color]) => (
                  <div key={ambito} className="flex items-center gap-1.5">
                    <div className={cn('w-3 h-3 rounded-full', color)} />
                    <span className="text-xs capitalize text-muted-foreground">{ambito}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDay} de {MONTH_NAMES[month]} {year}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay eventos este día.</p>
              ) : (
                selectedEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={cn('w-3 h-3 rounded-full mt-1 shrink-0', AMBITO_COLORS[ev.ambito])} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ev.nombre}</p>
                      <p className="text-xs text-muted-foreground">{ev.organismo}</p>
                      <Badge className={cn('mt-1 text-xs', AMBITO_STYLES[ev.ambito])}>{ev.ambito}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ConvocatoriasLayout>
  );
}
