import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Calculator, 
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  FileUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { 
  useBudgetLines, 
  useCreateBudgetLine, 
  useUpdateBudgetLine, 
  useDeleteBudgetLine,
  useBulkCreateBudgetLines,
  type BudgetLine as DBBudgetLine
} from '@/hooks/useBudgetLines';
import { supabase } from '@/integrations/supabase/client';
import { generarPresupuestoEstimado, checkDataAvailability, type BudgetEstimationInput, type DataAvailability } from '@/services/budgetEstimator';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocalBudgetLine {
  id: string;
  accountNumber: string;
  concept: string;
  units: number;
  quantity: number;
  unitPrice: number;
  agencyPercentage: number;
  total: number;
  isNew?: boolean;
}

interface BudgetChapter {
  id: number;
  name: string;
  lines: LocalBudgetLine[];
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
const getDefaultLines = (chapterId: number): LocalBudgetLine[] => {
  const templates: Record<number, Partial<LocalBudgetLine>[]> = {
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
    id: `new-${chapterId}-${i}`,
    accountNumber: t.accountNumber || '',
    concept: t.concept || '',
    units: 1,
    quantity: 1,
    unitPrice: 0,
    agencyPercentage: 0,
    total: 0,
    isNew: true,
  }));
};

// Convert DB line to local format
const dbToLocal = (line: DBBudgetLine): LocalBudgetLine => ({
  id: line.id,
  accountNumber: line.account_number || '',
  concept: line.concept,
  units: Number(line.units) || 1,
  quantity: Number(line.quantity) || 1,
  unitPrice: Number(line.unit_price) || 0,
  agencyPercentage: Number(line.agency_percentage) || 0,
  total: Number(line.total) || 0,
  isNew: false,
});

// Group DB lines by chapter
const groupByChapter = (dbLines: DBBudgetLine[]): BudgetChapter[] => {
  return ICAA_CHAPTERS.map(ch => {
    const chapterLines = dbLines.filter(line => line.chapter === ch.id);
    return {
      ...ch,
      lines: chapterLines.length > 0 
        ? chapterLines.map(dbToLocal)
        : getDefaultLines(ch.id),
      isOpen: ch.id <= 3,
    };
  });
};

export default function PresupuestoICAA() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: dbLines = [], isLoading: linesLoading } = useBudgetLines(projectId);
  
  const createLine = useCreateBudgetLine();
  const updateLine = useUpdateBudgetLine();
  const deleteLine = useDeleteBudgetLine();
  const bulkCreate = useBulkCreateBudgetLines();

  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null);
  const [showDataCheck, setShowDataCheck] = useState(false);

  // Initialize chapters from DB
  useEffect(() => {
    if (!linesLoading) {
      const grouped = groupByChapter(dbLines);
      setChapters(grouped);
      // Show empty state if no real budget lines (only defaults)
      const hasRealData = dbLines.length > 0;
      setShowEmptyState(!hasRealData);
    }
  }, [dbLines, linesLoading]);

  // Check data availability before generating
  const handleCheckDataAndGenerate = async () => {
    if (!projectId) return;
    
    setIsGenerating(true);
    try {
      // Fetch characters, locations, sequences, and creative analysis
      const [charactersRes, locationsRes, sequencesRes, analysisRes] = await Promise.all([
        supabase.from('characters').select('*').eq('project_id', projectId),
        supabase.from('locations').select('*').eq('project_id', projectId),
        supabase.from('sequences').select('*').eq('project_id', projectId),
        supabase.from('creative_analysis').select('*').eq('project_id', projectId).single(),
      ]);

      const input: BudgetEstimationInput = {
        characters: charactersRes.data || [],
        locations: locationsRes.data || [],
        sequences: sequencesRes.data || [],
        creativeAnalysis: analysisRes.data || null,
      };

      const availability = checkDataAvailability(input);
      setDataAvailability(availability);

      // If there are warnings, show the data check dialog
      if (availability.warnings.length > 0 && !availability.hasCharacters) {
        setShowDataCheck(true);
        setIsGenerating(false);
        toast({
          title: 'Sin datos de análisis',
          description: 'Primero analiza el guión para generar una estimación.',
          variant: 'destructive',
        });
        return;
      }

      // If there are warnings but we have characters, show warnings and proceed
      if (availability.warnings.length > 0) {
        setShowDataCheck(true);
      }

      // Generate the estimation
      await generateBudgetFromInput(input, availability);
    } catch (error) {
      console.error('Error checking data:', error);
      setIsGenerating(false);
      toast({
        title: 'Error al verificar datos',
        variant: 'destructive',
      });
    }
  };

  // Generate budget from validated input
  const generateBudgetFromInput = async (input: BudgetEstimationInput, availability: DataAvailability) => {
    if (!projectId) return;

    try {
      const estimatedLines = generarPresupuestoEstimado(input);
      
      // Insert all lines
      await bulkCreate.mutateAsync({ 
        projectId, 
        lines: estimatedLines 
      });

      setShowEmptyState(false);
      setShowDataCheck(false);
      
      const warningText = availability.warnings.length > 0 
        ? ' (con datos estimados para localizaciones/secuencias)'
        : '';
      
      toast({
        title: '✓ Presupuesto estimado generado',
        description: `Se crearon ${estimatedLines.length} partidas${warningText}`,
      });
    } catch (error) {
      console.error('Error generating estimation:', error);
      toast({
        title: 'Error al generar estimación',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Proceed with generation despite warnings
  const handleProceedWithGeneration = async () => {
    if (!projectId) return;
    
    setIsGenerating(true);
    try {
      const [charactersRes, locationsRes, sequencesRes, analysisRes] = await Promise.all([
        supabase.from('characters').select('*').eq('project_id', projectId),
        supabase.from('locations').select('*').eq('project_id', projectId),
        supabase.from('sequences').select('*').eq('project_id', projectId),
        supabase.from('creative_analysis').select('*').eq('project_id', projectId).single(),
      ]);

      const input: BudgetEstimationInput = {
        characters: charactersRes.data || [],
        locations: locationsRes.data || [],
        sequences: sequencesRes.data || [],
        creativeAnalysis: analysisRes.data || null,
      };

      const availability = checkDataAvailability(input);
      await generateBudgetFromInput(input, availability);
    } catch (error) {
      console.error('Error generating estimation:', error);
      toast({
        title: 'Error al generar estimación',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  };

  const handleSaveLine = async (chapterId: number, line: LocalBudgetLine) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      const lineData = {
        account_number: line.accountNumber,
        concept: line.concept,
        units: line.units,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        agency_percentage: line.agencyPercentage,
        total: line.total,
        chapter: chapterId,
      };

      if (line.isNew || line.id.startsWith('new-')) {
        const result = await createLine.mutateAsync({
          ...lineData,
          project_id: projectId,
        });
        // Update local state with real ID
        setChapters(prev => prev.map(ch => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            lines: ch.lines.map(l => 
              l.id === line.id ? { ...l, id: result.id, isNew: false } : l
            ),
          };
        }));
      } else {
        await updateLine.mutateAsync({
          id: line.id,
          projectId,
          updates: lineData,
        });
      }
      
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    } catch (error) {
      console.error('Error saving line:', error);
      toast({ 
        title: 'Error al guardar', 
        description: 'No se pudo guardar la partida',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    setChapters(prev => prev.map(ch => 
      ch.id === chapterId ? { ...ch, isOpen: !ch.isOpen } : ch
    ));
  };

  const handleUpdateLine = (chapterId: number, lineId: string, field: keyof LocalBudgetLine, value: any) => {
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

  const handleLineBlur = (chapterId: number, line: LocalBudgetLine) => {
    handleSaveLine(chapterId, line);
  };

  const addLine = (chapterId: number) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      
      const newLine: LocalBudgetLine = {
        id: `new-${chapterId}-${Date.now()}`,
        accountNumber: `${chapterId.toString().padStart(2, '0')}.${(ch.lines.length + 1).toString().padStart(2, '0')}`,
        concept: 'Nueva partida',
        units: 1,
        quantity: 1,
        unitPrice: 0,
        agencyPercentage: 0,
        total: 0,
        isNew: true,
      };
      
      return { ...ch, lines: [...ch.lines, newLine] };
    }));
  };

  const handleDeleteLine = async (chapterId: number, lineId: string) => {
    if (!projectId) return;
    
    // If it's a new line that hasn't been saved, just remove from state
    if (lineId.startsWith('new-')) {
      setChapters(prev => prev.map(ch => {
        if (ch.id !== chapterId) return ch;
        return { ...ch, lines: ch.lines.filter(line => line.id !== lineId) };
      }));
      return;
    }

    try {
      await deleteLine.mutateAsync({ id: lineId, projectId });
      setChapters(prev => prev.map(ch => {
        if (ch.id !== chapterId) return ch;
        return { ...ch, lines: ch.lines.filter(line => line.id !== lineId) };
      }));
      toast({ title: '✓ Partida eliminada', duration: 1000 });
    } catch (error) {
      console.error('Error deleting line:', error);
      toast({ 
        title: 'Error al eliminar', 
        variant: 'destructive' 
      });
    }
  };

  // Flexible Excel parser
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const lines: Omit<any, 'project_id'>[] = [];
      let currentChapter = 1;
      let chapterLineCount: Record<number, number> = {};

      // Column name variants for detection
      const conceptVariants = ['concepto', 'descripción', 'descripcion', 'detalle', 'partida', 'concept'];
      const accountVariants = ['cuenta', 'código', 'codigo', 'núm', 'num', 'nº', 'partida', 'account'];
      const totalVariants = ['total', 'importe', 'coste', 'precio', 'amount', '€'];

      // Detect header row and column indices
      let headerRowIndex = -1;
      let colMap: { concept: number; account: number; total: number; units: number; quantity: number; unitPrice: number } = {
        concept: -1, account: -1, total: -1, units: -1, quantity: -1, unitPrice: -1
      };

      for (let i = 0; i < Math.min(15, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '').toLowerCase().trim();
          
          if (conceptVariants.some(v => cell.includes(v)) && colMap.concept === -1) {
            colMap.concept = j;
            headerRowIndex = i;
          }
          if (accountVariants.some(v => cell.includes(v)) && colMap.account === -1) {
            colMap.account = j;
            headerRowIndex = i;
          }
          if (totalVariants.some(v => cell.includes(v)) && colMap.total === -1) {
            colMap.total = j;
          }
          if (cell === 'ud' || cell === 'unidades' || cell === 'units') {
            colMap.units = j;
          }
          if (cell === 'cantidad' || cell === 'qty' || cell === 'x') {
            colMap.quantity = j;
          }
          if (cell.includes('€/ud') || cell.includes('precio') || cell.includes('unit')) {
            colMap.unitPrice = j;
          }
        }
        if (headerRowIndex >= 0) break;
      }

      // If no header found, try positional detection
      if (headerRowIndex === -1) {
        headerRowIndex = 0;
        // Assume: Account | Concept | Units | Qty | Price | Total
        colMap = { account: 0, concept: 1, units: 2, quantity: 3, unitPrice: 4, total: 5 };
      }

      // Parse data rows
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.every(cell => cell == null || String(cell).trim() === '')) continue;

        // Check if this is a chapter header
        const rowText = row.map(c => String(c || '')).join(' ').toUpperCase();
        const chapterMatch = rowText.match(/CAP[ÍITU\.\s]*(\d{1,2})|CAPITULO\s*(\d{1,2})|^(\d{1,2})\s*[-–]\s*[A-Z]/);
        if (chapterMatch) {
          currentChapter = parseInt(chapterMatch[1] || chapterMatch[2] || chapterMatch[3]);
          if (currentChapter >= 1 && currentChapter <= 12) continue;
          currentChapter = 1; // Reset if invalid
        }

        // Extract values
        let accountNumber = '';
        let concept = '';
        let units = 1;
        let quantity = 1;
        let unitPrice = 0;
        let total = 0;

        // Try to get account number
        if (colMap.account >= 0 && row[colMap.account]) {
          const accStr = String(row[colMap.account]).trim();
          const accMatch = accStr.match(/(\d{1,2})[\.\-](\d{1,3})/);
          if (accMatch) {
            accountNumber = `${accMatch[1].padStart(2, '0')}.${accMatch[2].padStart(2, '0')}`;
            // Update current chapter from account number
            const chapFromAcc = parseInt(accMatch[1]);
            if (chapFromAcc >= 1 && chapFromAcc <= 12) {
              currentChapter = chapFromAcc;
            }
          }
        }

        // Get concept
        if (colMap.concept >= 0 && row[colMap.concept]) {
          concept = String(row[colMap.concept]).trim();
        }
        
        // If no concept found, look for any text cell
        if (!concept) {
          for (const cell of row) {
            if (typeof cell === 'string' && cell.length > 3 && isNaN(Number(cell.replace(/[.,\s€]/g, '')))) {
              concept = cell.trim();
              break;
            }
          }
        }

        // Skip if no concept
        if (!concept || concept.length < 2) continue;

        // Get numeric values
        const parseNumber = (val: any): number => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const str = String(val).replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
          return parseFloat(str) || 0;
        };

        if (colMap.total >= 0) total = parseNumber(row[colMap.total]);
        if (colMap.units >= 0) units = parseNumber(row[colMap.units]) || 1;
        if (colMap.quantity >= 0) quantity = parseNumber(row[colMap.quantity]) || 1;
        if (colMap.unitPrice >= 0) unitPrice = parseNumber(row[colMap.unitPrice]);

        // If we have total but no unit price, calculate it
        if (total > 0 && unitPrice === 0 && units > 0 && quantity > 0) {
          unitPrice = total / (units * quantity);
        }

        // If we have unit price but no total, calculate it
        if (unitPrice > 0 && total === 0) {
          total = units * quantity * unitPrice;
        }

        // Look for any number that could be the total if still not found
        if (total === 0) {
          for (let j = row.length - 1; j >= 0; j--) {
            const num = parseNumber(row[j]);
            if (num >= 100) { // Assume totals are at least 100€
              total = num;
              break;
            }
          }
        }

        // Generate account number if missing
        if (!accountNumber) {
          if (!chapterLineCount[currentChapter]) chapterLineCount[currentChapter] = 0;
          chapterLineCount[currentChapter]++;
          accountNumber = `${currentChapter.toString().padStart(2, '0')}.${chapterLineCount[currentChapter].toString().padStart(2, '0')}`;
        }

        lines.push({
          chapter: currentChapter,
          account_number: accountNumber,
          concept,
          units,
          quantity,
          unit_price: unitPrice,
          agency_percentage: 0,
          total,
        });
      }

      if (lines.length === 0) {
        toast({
          title: 'No se encontraron partidas',
          description: 'El archivo no contiene datos reconocibles. Intenta con un archivo que tenga columnas de concepto y totales.',
          variant: 'destructive',
        });
        return;
      }

      // Bulk insert
      await bulkCreate.mutateAsync({ projectId, lines });
      setShowEmptyState(false);
      
      toast({
        title: '✓ Excel importado',
        description: `Se importaron ${lines.length} partidas en ${Object.keys(chapterLineCount).length || 'varios'} capítulos`,
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: 'Error al importar',
        description: 'No se pudo leer el archivo Excel',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getChapterTotal = (chapter: BudgetChapter) => 
    chapter.lines.reduce((sum, line) => sum + line.total, 0);

  const grandTotal = chapters.reduce((sum, ch) => sum + getChapterTotal(ch), 0);

  const projectTitle = project?.title || 'Mi Proyecto';

  if (projectLoading || linesLoading) {
    return (
      <ProductionLayout projectTitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ProductionLayout>
    );
  }

  return (
    <ProductionLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Data Availability Warning */}
        {showDataCheck && dataAvailability && (
          <Alert variant={dataAvailability.warnings.length > 0 ? 'default' : 'default'} className="border-amber-500/50 bg-amber-500/10">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium">Estado de los datos del análisis:</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {dataAvailability.hasCharacters ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{dataAvailability.charactersCount} personajes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dataAvailability.hasLocations ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{dataAvailability.locationsCount} localizaciones {!dataAvailability.hasLocations && '(se estimarán)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dataAvailability.hasSequences ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{dataAvailability.sequencesCount} secuencias {!dataAvailability.hasSequences && '(días de rodaje estimados)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {dataAvailability.hasCreativeAnalysis ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Análisis creativo {dataAvailability.hasCreativeAnalysis ? 'disponible' : 'no disponible'}</span>
                  </div>
                </div>
                {dataAvailability.warnings.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={handleProceedWithGeneration}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generar con datos actuales
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowDataCheck(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State - Show options when no budget lines exist */}
        {showEmptyState && !showDataCheck && (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Comienza tu presupuesto</h3>
                  <p className="text-muted-foreground mt-1">
                    Elige cómo quieres empezar a trabajar en el presupuesto ICAA
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
                  <Button 
                    variant="default"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={handleCheckDataAndGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                    <span className="font-semibold">Generar estimación</span>
                    <span className="text-xs opacity-80">Desde el análisis del guión</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <FileUp className="w-6 h-6" />
                    )}
                    <span className="font-semibold">Importar Excel</span>
                    <span className="text-xs opacity-80">Usa un proyecto de referencia</span>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setShowEmptyState(false)}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="font-semibold">Empezar desde cero</span>
                    <span className="text-xs opacity-80">Añade partidas manualmente</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary & Actions - Always visible */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Calculator className="w-10 h-10 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Presupuesto ICAA</h2>
                  <p className="text-sm text-muted-foreground">12 Capítulos oficiales</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleCheckDataAndGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generar estimación
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Importar Excel
                </Button>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">TOTAL PRESUPUESTO</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters - Hide when showing empty state */}
        {!showEmptyState && chapters.map((chapter) => (
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
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'accountNumber', e.target.value)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
                              className="w-20 font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.concept}
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'concept', e.target.value)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.units}
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'units', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'quantity', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
                              className="w-16 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.unitPrice}
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={line.agencyPercentage}
                              onChange={(e) => handleUpdateLine(chapter.id, line.id, 'agencyPercentage', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleLineBlur(chapter.id, line)}
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
                              onClick={() => handleDeleteLine(chapter.id, line.id)}
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

        {/* Grand Total - Hide when showing empty state */}
        {!showEmptyState && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold">TOTAL GENERAL</span>
                <span className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProductionLayout>
  );
}
