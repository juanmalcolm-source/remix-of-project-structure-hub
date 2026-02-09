import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject } from '@/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, AlertTriangle, Percent, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const formatEUR = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(280 67% 50%)',
  'hsl(0 84% 60%)',
];

function KpiCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'info';
}) {
  const variantClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${variantClasses[variant]}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${variantClasses[variant]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-36" />
      </CardContent>
    </Card>
  );
}

export default function ResumenPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  const { data: sources, isLoading: loadingSources } = useQuery({
    queryKey: ['financing-sources', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_sources')
        .select('*')
        .eq('project_id', projectId!);
      if (error) throw error;
      return data as Tables<'financing_sources'>[];
    },
    enabled: !!projectId,
  });

  const { data: budgetLines, isLoading: loadingBudget } = useQuery({
    queryKey: ['budget-lines-total', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('total')
        .eq('project_id', projectId!);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['financing-plan', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_plan')
        .select('*')
        .eq('project_id', projectId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const isLoading = loadingSources || loadingBudget || loadingPlan;

  // Compute KPIs
  const totalBudget = budgetLines?.reduce((sum, l) => sum + (Number(l.total) || 0), 0) ?? 0;
  const totalFinanced = sources?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) ?? 0;
  const gap = totalBudget - totalFinanced;
  const intensity = totalBudget > 0 ? (totalFinanced / totalBudget) * 100 : 0;

  // Chart data by source_type
  const byType = (sources ?? []).reduce<Record<string, number>>((acc, s) => {
    const type = s.source_type || 'Sin tipo';
    acc[type] = (acc[type] || 0) + (Number(s.amount) || 0);
    return acc;
  }, {});
  const chartData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const isEmpty = !sources || sources.length === 0;

  return (
    <FinancingLayout projectTitle={project?.title}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold">Resumen Financiero</h1>
          <p className="text-muted-foreground mt-1">Dashboard consolidado de métricas financieras del proyecto.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <KpiCard title="Presupuesto Total" value={formatEUR(totalBudget)} icon={DollarSign} />
              <KpiCard title="Financiación Asegurada" value={formatEUR(totalFinanced)} icon={TrendingUp} variant="success" />
              <KpiCard title="Brecha de Financiación" value={formatEUR(gap)} icon={AlertTriangle} variant={gap > 0 ? 'warning' : 'success'} />
              <KpiCard title="Intensidad de Ayuda" value={`${intensity.toFixed(1)}%`} icon={Percent} variant="info" />
            </>
          )}
        </div>

        {isEmpty && !isLoading ? (
          <Alert className="border-blue-500/30 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700">Sin financiación registrada</AlertTitle>
            <AlertDescription className="text-blue-600">
              Añade fuentes de financiación desde la pestaña "Fuentes Financiación" para ver el resumen completo.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Desglose por Tipo de Fuente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatEUR(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fuentes de Financiación</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="text-right">% del Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sources ?? []).map((s) => {
                        const pct = totalBudget > 0 ? ((Number(s.amount) || 0) / totalBudget) * 100 : 0;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.source_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.source_type || 'Sin tipo'}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatEUR(Number(s.amount) || 0)}</TableCell>
                            <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </FinancingLayout>
  );
}
