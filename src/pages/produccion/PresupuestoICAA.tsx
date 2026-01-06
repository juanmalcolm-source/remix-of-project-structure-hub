import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calculator, 
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface BudgetLine {
  id: string;
  accountNumber: string;
  concept: string;
  units: number;
  quantity: number;
  unitPrice: number;
  agencyPercentage: number;
  total: number;
}

interface BudgetChapter {
  id: number;
  name: string;
  lines: BudgetLine[];
  isOpen: boolean;
}

// ICAA Official 12 Chapters
const ICAA_CHAPTERS = [
  { id: 1, name: 'CAP. 01 - Guión y Música' },
  { id: 2, name: 'CAP. 02 - Personal Artístico' },
  { id: 3, name: 'CAP. 03 - Equipo Técnico' },
  { id: 4, name: 'CAP. 04 - Escenografía' },
  { id: 5, name: 'CAP. 05 - Estudios Rodaje/Sonorización y Varios Producción' },
  { id: 6, name: 'CAP. 06 - Maquinaria, Rodaje y Transportes' },
  { id: 7, name: 'CAP. 07 - Viajes, Hoteles y Comidas' },
  { id: 8, name: 'CAP. 08 - Película Virgen' },
  { id: 9, name: 'CAP. 09 - Laboratorio' },
  { id: 10, name: 'CAP. 10 - Seguros' },
  { id: 11, name: 'CAP. 11 - Gastos Generales' },
  { id: 12, name: 'CAP. 12 - Gastos Explotación, Comercio y Financiación' },
];

// Default line templates per chapter
const getDefaultLines = (chapterId: number): BudgetLine[] => {
  const templates: Record<number, Partial<BudgetLine>[]> = {
    1: [
      { accountNumber: '01.01', concept: 'Guión (derechos autor)' },
      { accountNumber: '01.02', concept: 'Música original' },
      { accountNumber: '01.03', concept: 'Derechos musicales' },
    ],
    2: [
      { accountNumber: '02.01', concept: 'Protagonistas' },
      { accountNumber: '02.02', concept: 'Principales' },
      { accountNumber: '02.03', concept: 'Secundarios' },
      { accountNumber: '02.04', concept: 'Figuración' },
      { accountNumber: '02.05', concept: 'Dobladores' },
    ],
    3: [
      { accountNumber: '03.01', concept: 'Director/a' },
      { accountNumber: '03.02', concept: 'Productor/a ejecutivo' },
      { accountNumber: '03.03', concept: 'Director/a de producción' },
      { accountNumber: '03.04', concept: 'Director/a de fotografía' },
      { accountNumber: '03.05', concept: 'Operador/a de cámara' },
      { accountNumber: '03.06', concept: 'Jefe/a de sonido' },
      { accountNumber: '03.07', concept: 'Director/a de arte' },
      { accountNumber: '03.08', concept: 'Jefe/a de maquillaje' },
      { accountNumber: '03.09', concept: 'Jefe/a de vestuario' },
      { accountNumber: '03.10', concept: 'Script / Continuidad' },
      { accountNumber: '03.11', concept: 'Montador/a' },
    ],
    4: [
      { accountNumber: '04.01', concept: 'Decorados' },
      { accountNumber: '04.02', concept: 'Ambientación' },
      { accountNumber: '04.03', concept: 'Mobiliario' },
      { accountNumber: '04.04', concept: 'Attrezzo' },
      { accountNumber: '04.05', concept: 'Vestuario' },
      { accountNumber: '04.06', concept: 'Maquillaje y peluquería' },
    ],
    5: [
      { accountNumber: '05.01', concept: 'Alquiler plató' },
      { accountNumber: '05.02', concept: 'Sonorización' },
      { accountNumber: '05.03', concept: 'Varios producción' },
    ],
    6: [
      { accountNumber: '06.01', concept: 'Maquinaria cámara' },
      { accountNumber: '06.02', concept: 'Maquinaria iluminación' },
      { accountNumber: '06.03', concept: 'Maquinaria sonido' },
      { accountNumber: '06.04', concept: 'Transportes' },
    ],
    7: [
      { accountNumber: '07.01', concept: 'Viajes equipo' },
      { accountNumber: '07.02', concept: 'Hoteles' },
      { accountNumber: '07.03', concept: 'Dietas y comidas' },
    ],
    8: [
      { accountNumber: '08.01', concept: 'Material sensible / Almacenamiento digital' },
    ],
    9: [
      { accountNumber: '09.01', concept: 'Revelado / Procesado' },
      { accountNumber: '09.02', concept: 'Etalonaje' },
      { accountNumber: '09.03', concept: 'Copias / DCPs' },
      { accountNumber: '09.04', concept: 'Efectos visuales (VFX)' },
    ],
    10: [
      { accountNumber: '10.01', concept: 'Seguro de responsabilidad civil' },
      { accountNumber: '10.02', concept: 'Seguro de negativo' },
      { accountNumber: '10.03', concept: 'Seguro de buen fin' },
    ],
    11: [
      { accountNumber: '11.01', concept: 'Gastos de oficina' },
      { accountNumber: '11.02', concept: 'Gestoría y asesoría' },
      { accountNumber: '11.03', concept: 'Imprevistos' },
    ],
    12: [
      { accountNumber: '12.01', concept: 'Copias promocionales' },
      { accountNumber: '12.02', concept: 'Publicidad y marketing' },
      { accountNumber: '12.03', concept: 'Gastos financieros' },
    ],
  };

  return (templates[chapterId] || []).map((t, i) => ({
    id: `${chapterId}-${i}`,
    accountNumber: t.accountNumber || '',
    concept: t.concept || '',
    units: 1,
    quantity: 1,
    unitPrice: 0,
    agencyPercentage: 0,
    total: 0,
  }));
};

export default function PresupuestoICAA() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [chapters, setChapters] = useState<BudgetChapter[]>(
    ICAA_CHAPTERS.map(ch => ({
      ...ch,
      lines: getDefaultLines(ch.id),
      isOpen: ch.id <= 3, // Open first 3 chapters by default
    }))
  );

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

  const toggleChapter = (chapterId: number) => {
    setChapters(prev => prev.map(ch => 
      ch.id === chapterId ? { ...ch, isOpen: !ch.isOpen } : ch
    ));
  };

  const updateLine = (chapterId: number, lineId: string, field: keyof BudgetLine, value: any) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      
      return {
        ...ch,
        lines: ch.lines.map(line => {
          if (line.id !== lineId) return line;
          
          const updated = { ...line, [field]: value };
          // Recalculate total
          updated.total = updated.units * updated.quantity * updated.unitPrice * (1 + updated.agencyPercentage / 100);
          return updated;
        })
      };
    }));
  };

  const addLine = (chapterId: number) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      
      const newLine: BudgetLine = {
        id: `${chapterId}-${Date.now()}`,
        accountNumber: `${chapterId.toString().padStart(2, '0')}.${(ch.lines.length + 1).toString().padStart(2, '0')}`,
        concept: 'Nueva partida',
        units: 1,
        quantity: 1,
        unitPrice: 0,
        agencyPercentage: 0,
        total: 0,
      };
      
      return { ...ch, lines: [...ch.lines, newLine] };
    }));
  };

  const deleteLine = (chapterId: number, lineId: string) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      return { ...ch, lines: ch.lines.filter(line => line.id !== lineId) };
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Calculate totals
  const getChapterTotal = (chapter: BudgetChapter) => 
    chapter.lines.reduce((sum, line) => sum + line.total, 0);

  const grandTotal = chapters.reduce((sum, ch) => sum + getChapterTotal(ch), 0);

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <ProductionLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Summary */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calculator className="w-10 h-10 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Presupuesto ICAA</h2>
                  <p className="text-sm text-muted-foreground">12 Capítulos oficiales</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">TOTAL PRESUPUESTO</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters */}
        {chapters.map((chapter) => (
          <Collapsible 
            key={chapter.id} 
            open={chapter.isOpen}
            onOpenChange={() => toggleChapter(chapter.id)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {chapter.isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      {chapter.name}
                      <Badge variant="secondary">{chapter.lines.length} partidas</Badge>
                    </span>
                    <span className="font-bold">{formatCurrency(getChapterTotal(chapter))}</span>
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Núm.</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="w-20 text-right">UD</TableHead>
                        <TableHead className="w-20 text-right">X</TableHead>
                        <TableHead className="w-28 text-right">€/Ud</TableHead>
                        <TableHead className="w-20 text-right">AG%</TableHead>
                        <TableHead className="w-28 text-right">TOTAL</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chapter.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              value={line.accountNumber}
                              onChange={(e) => updateLine(chapter.id, line.id, 'accountNumber', e.target.value)}
                              onBlur={handleSave}
                              className="w-20 font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.concept}
                              onChange={(e) => updateLine(chapter.id, line.id, 'concept', e.target.value)}
                              onBlur={handleSave}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.units}
                              onChange={(e) => updateLine(chapter.id, line.id, 'units', parseFloat(e.target.value) || 0)}
                              onBlur={handleSave}
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateLine(chapter.id, line.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onBlur={handleSave}
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(chapter.id, line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              onBlur={handleSave}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.agencyPercentage}
                              onChange={(e) => updateLine(chapter.id, line.id, 'agencyPercentage', parseFloat(e.target.value) || 0)}
                              onBlur={handleSave}
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(line.total)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteLine(chapter.id, line.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addLine(chapter.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir partida
                    </Button>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground mr-4">Subtotal {chapter.name.split(' - ')[0]}:</span>
                      <span className="text-lg font-bold">{formatCurrency(getChapterTotal(chapter))}</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        {/* Grand Total */}
        <Card className="border-2 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">TOTAL GENERAL</span>
              <span className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}
