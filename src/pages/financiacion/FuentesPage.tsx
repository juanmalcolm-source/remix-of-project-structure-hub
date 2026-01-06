import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Wallet, 
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import FinancingLayout from '@/components/layout/FinancingLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface FundingSource {
  id: string;
  type: string;
  name: string;
  amount: number;
  status: 'confirmada' | 'solicitada' | 'prevista';
  expectedDate: string;
}

const SOURCE_TYPES = [
  { value: 'icaa_general', label: 'ICAA General' },
  { value: 'icaa_selectiva', label: 'ICAA Selectiva' },
  { value: 'autonomica', label: 'Ayuda Autonómica' },
  { value: 'coproduccion', label: 'Coproducción' },
  { value: 'preventa_tv', label: 'Preventa TV' },
  { value: 'patrocinio', label: 'Patrocinio' },
  { value: 'privado', label: 'Fondo Privado' },
  { value: 'tax_credit', label: 'Tax Credit' },
  { value: 'otro', label: 'Otro' },
];

export default function FuentesPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [sources, setSources] = useState<FundingSource[]>([
    { id: '1', type: 'icaa_general', name: 'ICAA Ayuda General', amount: 200000, status: 'solicitada', expectedDate: '2025-06' },
    { id: '2', type: 'autonomica', name: 'Film Commission Madrid', amount: 50000, status: 'confirmada', expectedDate: '2025-03' },
    { id: '3', type: 'tax_credit', name: 'Incentivo Fiscal Navarra', amount: 150000, status: 'prevista', expectedDate: '2026-01' },
    { id: '4', type: 'preventa_tv', name: 'TVE', amount: 80000, status: 'solicitada', expectedDate: '2025-09' },
  ]);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const updateSource = (id: string, field: keyof FundingSource, value: any) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSource = () => {
    const newSource: FundingSource = {
      id: `source-${Date.now()}`,
      type: 'otro',
      name: 'Nueva fuente',
      amount: 0,
      status: 'prevista',
      expectedDate: '',
    };
    setSources(prev => [...prev, newSource]);
  };

  const deleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Fuente eliminada' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'solicitada': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'prevista': return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-500/20 text-green-700';
      case 'solicitada': return 'bg-yellow-500/20 text-yellow-700';
      case 'prevista': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  // Calculate totals by status
  const totalConfirmada = sources.filter(s => s.status === 'confirmada').reduce((sum, s) => sum + s.amount, 0);
  const totalSolicitada = sources.filter(s => s.status === 'solicitada').reduce((sum, s) => sum + s.amount, 0);
  const totalPrevista = sources.filter(s => s.status === 'prevista').reduce((sum, s) => sum + s.amount, 0);
  const grandTotal = sources.reduce((sum, s) => sum + s.amount, 0);

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <FinancingLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalConfirmada)}</p>
              <p className="text-sm text-muted-foreground">Confirmada</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalSolicitada)}</p>
              <p className="text-sm text-muted-foreground">Solicitada</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(totalPrevista)}</p>
              <p className="text-sm text-muted-foreground">Prevista</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Wallet className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
              <p className="text-sm text-muted-foreground">Total Plan</p>
            </CardContent>
          </Card>
        </div>

        {/* Sources Table */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Fuentes de Financiación
              </span>
              <Button onClick={addSource} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Añadir fuente
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha prevista</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <Select 
                        value={source.type}
                        onValueChange={(value) => { updateSource(source.id, 'type', value); handleSave(); }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={source.name}
                        onChange={(e) => updateSource(source.id, 'name', e.target.value)}
                        onBlur={handleSave}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={source.amount}
                        onChange={(e) => updateSource(source.id, 'amount', parseInt(e.target.value) || 0)}
                        onBlur={handleSave}
                        className="w-28 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={source.status}
                        onValueChange={(value) => { updateSource(source.id, 'status', value); handleSave(); }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmada">✓ Confirmada</SelectItem>
                          <SelectItem value="solicitada">⏳ Solicitada</SelectItem>
                          <SelectItem value="prevista">? Prevista</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="month"
                        value={source.expectedDate}
                        onChange={(e) => updateSource(source.id, 'expectedDate', e.target.value)}
                        onBlur={handleSave}
                        className="w-36"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteSource(source.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-4">TOTAL PLAN DE FINANCIACIÓN:</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancingLayout>
  );
}
