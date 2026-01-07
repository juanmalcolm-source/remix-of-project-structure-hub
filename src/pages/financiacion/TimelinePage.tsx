import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject, useFinancingSources } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

interface CashFlowItem {
  month: string;
  income: number;
  expense: number;
  source?: string;
  cumulative: number;
}

export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: dbSources, isLoading: sourcesLoading } = useFinancingSources(projectId);

  // Build payments from real data + simulated expenses
  const payments = useMemo(() => {
    const result: { month: string; amount: number; source: string; type: 'income' | 'expense' }[] = [];
    
    // Add incomes from financing sources
    if (dbSources) {
      dbSources.forEach(s => {
        if (s.expected_payment_date && s.amount) {
          result.push({
            month: s.expected_payment_date.substring(0, 7), // YYYY-MM
            amount: s.amount,
            source: s.source_name,
            type: 'income'
          });
        }
      });
    }

    // Add simulated expenses based on budget
    const budget = project?.financing_plan?.total_budget || 500000;
    const now = new Date();
    const baseMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;
    
    result.push(
      { month: baseMonth, amount: budget * 0.15, source: 'Preproducción', type: 'expense' },
      { month: `${now.getFullYear()}-${String(now.getMonth() + 3).padStart(2, '0')}`, amount: budget * 0.35, source: 'Rodaje', type: 'expense' },
      { month: `${now.getFullYear()}-${String(now.getMonth() + 4).padStart(2, '0')}`, amount: budget * 0.25, source: 'Postproducción', type: 'expense' },
      { month: `${now.getFullYear()}-${String(now.getMonth() + 5).padStart(2, '0')}`, amount: budget * 0.1, source: 'Marketing', type: 'expense' }
    );

    return result;
  }, [dbSources, project]);

  // Calculate cash flow
  const cashFlow = useMemo(() => {
    const months: CashFlowItem[] = [];
    let cumulative = 0;

    const allMonths = [...new Set(payments.map(p => p.month))].sort();
    
    for (const month of allMonths) {
      const monthPayments = payments.filter(p => p.month === month);
      const income = monthPayments.filter(p => p.type === 'income').reduce((sum, p) => sum + p.amount, 0);
      const expense = monthPayments.filter(p => p.type === 'expense').reduce((sum, p) => sum + p.amount, 0);
      
      cumulative += income - expense;
      
      months.push({
        month,
        income,
        expense,
        source: monthPayments.map(p => p.source).join(', '),
        cumulative
      });
    }

    return months;
  }, [payments]);

  const gaps = cashFlow.filter(cf => cf.cumulative < 0);
  const minCumulative = cashFlow.length > 0 ? Math.min(...cashFlow.map(cf => cf.cumulative)) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const isLoading = projectLoading || sourcesLoading;

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-32 mx-auto max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </FinancingLayout>
    );
  }

  if (!project) {
    return (
      <FinancingLayout projectTitle="Error">
        <div className="text-center py-12 text-muted-foreground">
          No se encontró el proyecto
        </div>
      </FinancingLayout>
    );
  }

  const projectTitle = project.title || 'Mi Proyecto';
  const maxValue = cashFlow.length > 0 
    ? Math.max(
        Math.max(...cashFlow.map(cf => cf.income)), 
        Math.max(...cashFlow.map(cf => cf.expense)), 
        Math.abs(minCumulative)
      ) 
    : 1;

  return (
    <FinancingLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Calendar className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Timeline de Cobros y Cash Flow</h2>
          <p className="text-muted-foreground">
            Visualiza cuándo llegarán los ingresos y detecta posibles gaps de liquidez
          </p>
        </div>

        {/* Gap Alert */}
        {gaps.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>¡Atención! Gap de liquidez detectado</AlertTitle>
            <AlertDescription>
              En {gaps.length} mes(es) tendrás flujo de caja negativo. 
              El punto más bajo será {formatCurrency(minCumulative)} en {formatMonth(gaps[gaps.length - 1].month)}.
              Considera un préstamo puente (bridge loan) de al menos {formatCurrency(Math.abs(minCumulative))}.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <ArrowDown className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(cashFlow.reduce((sum, cf) => sum + cf.income, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <ArrowUp className="w-8 h-8 mx-auto text-red-600 mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(cashFlow.reduce((sum, cf) => sum + cf.expense, 0))}
              </p>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">
                {formatCurrency(cashFlow[cashFlow.length - 1]?.cumulative || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Saldo Final</p>
            </CardContent>
          </Card>
          
          <Card className={minCumulative < 0 ? 'border-red-500/50 bg-red-500/5' : ''}>
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className={`text-2xl font-bold ${minCumulative < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(minCumulative)}
              </p>
              <p className="text-sm text-muted-foreground">Punto más bajo</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Mensual</CardTitle>
            <CardDescription>Ingresos, gastos y saldo acumulado por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {cashFlow.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay datos de flujo de caja. Añade fuentes de financiación con fechas de cobro.
              </div>
            ) : (
              <div className="space-y-4">
                {cashFlow.map((cf) => (
                  <div key={cf.month} className="relative">
                    <div className="flex items-center gap-4">
                      {/* Month label */}
                      <div className="w-20 text-sm font-medium">
                        {formatMonth(cf.month)}
                      </div>

                      {/* Bars */}
                      <div className="flex-1 space-y-1">
                        {/* Income bar */}
                        {cf.income > 0 && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-6 bg-green-500/80 rounded flex items-center justify-end pr-2"
                              style={{ width: `${(cf.income / maxValue) * 100}%`, minWidth: '60px' }}
                            >
                              <span className="text-xs text-white font-medium">
                                +{formatCurrency(cf.income)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {payments.filter(p => p.month === cf.month && p.type === 'income').map(p => p.source).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Expense bar */}
                        {cf.expense > 0 && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-6 bg-red-500/80 rounded flex items-center justify-end pr-2"
                              style={{ width: `${(cf.expense / maxValue) * 100}%`, minWidth: '60px' }}
                            >
                              <span className="text-xs text-white font-medium">
                                -{formatCurrency(cf.expense)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {payments.filter(p => p.month === cf.month && p.type === 'expense').map(p => p.source).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cumulative */}
                      <div className={`w-28 text-right font-semibold ${cf.cumulative < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(cf.cumulative)}
                      </div>
                    </div>

                    {/* Gap warning */}
                    {cf.cumulative < 0 && (
                      <Badge variant="destructive" className="absolute right-0 -bottom-1 text-xs">
                        Gap
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            {cashFlow.length > 0 && (
              <div className="flex items-center gap-6 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-sm text-muted-foreground">Gastos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Columna derecha = Saldo acumulado</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bridge Loan Suggestion */}
        {minCumulative < 0 && (
          <Card className="bg-yellow-500/5 border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <DollarSign className="w-5 h-5" />
                Sugerencia: Préstamo Puente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para cubrir el gap de liquidez detectado, necesitarás un préstamo puente de aproximadamente:
              </p>
              <p className="text-3xl font-bold text-yellow-700 mb-4">
                {formatCurrency(Math.abs(minCumulative) * 1.1)}
              </p>
              <p className="text-sm text-muted-foreground">
                Este préstamo se podría devolver cuando lleguen los ingresos del Tax Credit 
                (típicamente 12-18 meses después del rodaje).
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FinancingLayout>
  );
}