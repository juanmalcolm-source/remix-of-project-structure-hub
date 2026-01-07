import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Wallet, 
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject, useFinancingSources, useCreateFinancingSource, useUpdateFinancingSource, useDeleteFinancingSource } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: dbSources, isLoading: sourcesLoading } = useFinancingSources(projectId);
  const createSource = useCreateFinancingSource();
  const updateSource = useUpdateFinancingSource();
  const deleteSourceMutation = useDeleteFinancingSource();

  const [sources, setSources] = useState<FundingSource[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from database
  useEffect(() => {
    if (dbSources && dbSources.length > 0) {
      const mapped = dbSources.map((s) => ({
        id: s.id,
        type: s.source_type || 'otro',
        name: s.source_name,
        amount: s.amount || 0,
        status: (s.status || 'prevista') as FundingSource['status'],
        expectedDate: s.expected_payment_date || '',
      }));
      setSources(mapped);
    }
  }, [dbSources]);

  const handleSave = async (source: FundingSource) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      await updateSource.mutateAsync({
        id: source.id,
        projectId,
        data: {
          source_type: source.type,
          source_name: source.name,
          amount: source.amount,
          status: source.status,
          expected_payment_date: source.expectedDate || null,
        }
      });
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const updateLocalSource = (id: string, field: keyof FundingSource, value: unknown) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSource = async () => {
    if (!projectId) return;
    
    try {
      await createSource.mutateAsync({
        projectId,
        data: {
          source_name: 'Nueva fuente',
          source_type: 'otro',
          amount: 0,
          status: 'prevista',
        }
      });
      toast({ title: 'Fuente añadida' });
    } catch (error) {
      toast({ title: 'Error al crear', variant: 'destructive' });
    }
  };

  const deleteSource = async (id: string) => {
    if (!projectId) return;
    try {
      await deleteSourceMutation.mutateAsync({ id, projectId });
      setSources(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Fuente eliminada' });
    } catch (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const isLoading = projectLoading || sourcesLoading;

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="space-y-6">
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

  // Calculate totals by status
  const totalConfirmada = sources.filter(s => s.status === 'confirmada').reduce((sum, s) => sum + s.amount, 0);
  const totalSolicitada = sources.filter(s => s.status === 'solicitada').reduce((sum, s) => sum + s.amount, 0);
  const totalPrevista = sources.filter(s => s.status === 'prevista').reduce((sum, s) => sum + s.amount, 0);
  const grandTotal = sources.reduce((sum, s) => sum + s.amount, 0);

  const projectTitle = project.title || 'Mi Proyecto';

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
            {sources.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay fuentes de financiación. Haz clic en "Añadir fuente" para empezar.
              </div>
            ) : (
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
                          onValueChange={(value) => { 
                            updateLocalSource(source.id, 'type', value); 
                            handleSave({ ...source, type: value }); 
                          }}
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
                          onChange={(e) => updateLocalSource(source.id, 'name', e.target.value)}
                          onBlur={() => handleSave(source)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={source.amount}
                          onChange={(e) => updateLocalSource(source.id, 'amount', parseInt(e.target.value) || 0)}
                          onBlur={() => handleSave(source)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={source.status}
                          onValueChange={(value) => { 
                            updateLocalSource(source.id, 'status', value); 
                            handleSave({ ...source, status: value as FundingSource['status'] }); 
                          }}
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
                          onChange={(e) => updateLocalSource(source.id, 'expectedDate', e.target.value)}
                          onBlur={() => handleSave(source)}
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
            )}

            {sources.length > 0 && (
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground mr-4">TOTAL PLAN DE FINANCIACIÓN:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FinancingLayout>
  );
}