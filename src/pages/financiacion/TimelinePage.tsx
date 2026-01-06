import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import type { AnalisisGuion } from '@/types/analisisGuion';

interface CashFlowItem {
  month: string;
  income: number;
  expense: number;
  source?: string;
  cumulative: number;
}

export default function TimelinePage() {
  const location = useLocation();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  // Simulated payment timeline data
  const [payments] = useState([
    { month: '2025-01', amount: 50000, source: 'Film Commission Madrid', type: 'income' },
    { month: '2025-02', amount: -80000, source: 'Preproducción', type: 'expense' },
    { month: '2025-03', amount: -150000, source: 'Rodaje Semana 1-2', type: 'expense' },
    { month: '2025-04', amount: -150000, source: 'Rodaje Semana 3-4', type: 'expense' },
    { month: '2025-05', amount: 80000, source: 'Preventa TVE', type: 'income' },
    { month: '2025-06', amount: -50000, source: 'Postproducción', type: 'expense' },
    { month: '2025-07', amount: 200000, source: 'ICAA Ayuda General', type: 'income' },
    { month: '2025-09', amount: -30000, source: 'Marketing', type: 'expense' },
    { month: '2026-01', amount: 150000, source: 'Tax Credit Navarra', type: 'income' },
  ]);

  // Calculate cash flow
  const cashFlow = useMemo(() => {
    const months: CashFlowItem[] = [];
    let cumulative = 0;

    // Get all unique months and sort them
    const allMonths = [...new Set(payments.map(p => p.month))].sort();
    
    for (const month of allMonths) {
      const monthPayments = payments.filter(p => p.month === month);
      const income = monthPayments.filter(p => p.type === 'income').reduce((sum, p) => sum + p.amount, 0);
      const expense = Math.abs(monthPayments.filter(p => p.type === 'expense').reduce((sum, p) => sum + p.amount, 0));
      
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

  // Find gaps (negative cumulative)
  const gaps = cashFlow.filter(cf => cf.cumulative < 0);
  const minCumulative = Math.min(...cashFlow.map(cf => cf.cumulative));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  // Calculate max values for chart scaling
  const maxIncome = Math.max(...cashFlow.map(cf => cf.income));
  const maxExpense = Math.max(...cashFlow.map(cf => cf.expense));
  const maxValue = Math.max(maxIncome, maxExpense, Math.abs(minCumulative));

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
            <div className="space-y-4">
              {cashFlow.map((cf, index) => (
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

            {/* Legend */}
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
                {formatCurrency(Math.abs(minCumulative) * 1.1)} {/* +10% margen seguridad */}
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
