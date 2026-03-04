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
  FileUp,
  AlertTriangle,
  Zap,
  RefreshCw,
  DollarSign,
  Film,
  CalendarDays,
  Clock,
  Save,
  History,
  RotateCcw,
  ArrowLeftRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import {
  useBudgetVersions,
  useCreateBudgetVersion,
  useDeleteBudgetVersion,
} from '@/hooks/useBudgetVersions';
import { supabase } from '@/integrations/supabase/client';
import {
  generarPresupuestoEstimado,
  generarPresupuestoConIA,
  checkDataAvailability,
  type BudgetEstimationInput,
  type DataAvailability,
  type BudgetLevel,
  type AIBudgetResponse
} from '@/services/budgetEstimator';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PERSONNEL_CHAPTERS,
  ICAA_CHAPTERS,
  UNIT_TYPES,
  SS_TOTAL_BY_CONTRACT,
  type UnitType,
  type ContractType,
} from '@/constants/budgetDefaults';
import {
  recalculatePersonnelCosts,
  getDefaultSSRate,
  getDefaultIRPFRate,
  getDefaultUnitType,
  getDefaultContractType,
  calculateTotalPeriods,
} from '@/services/ssIrpfCalculator';

interface LocalBudgetLine {
  id: string;
  accountNumber: string;
  concept: string;
  units: number;
  quantity: number;
  unitPrice: number;
  agencyPercentage: number;
  total: number;
  // Personnel chapter fields (Cap 02, 03)
  ssPercentage: number;
  ssCost: number;
  irpfPercentage: number;
  irpfCost: number;
  // New fields: unit type, phases, contract
  unitType: UnitType;
  preWeeks: number;
  rodWeeks: number;
  postWeeks: number;
  contractType: ContractType;
  isNew?: boolean;
}

interface BudgetChapter {
  id: number;
  name: string;
  lines: LocalBudgetLine[];
  isOpen: boolean;
}

/** Shape of `budget_json` stored in budget_versions */
interface BudgetVersionSnapshot {
  chapters: {
    id: number;
    name: string;
    lines: {
      accountNumber: string;
      concept: string;
      units: number;
      quantity: number;
      unitPrice: number;
      agencyPercentage: number;
      total: number;
      ssPercentage?: number;
      ssCost?: number;
      irpfPercentage?: number;
      irpfCost?: number;
      unitType?: UnitType;
      preWeeks?: number;
      rodWeeks?: number;
      postWeeks?: number;
      contractType?: ContractType;
    }[];
  }[];
}

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

  const isPersonnel = (PERSONNEL_CHAPTERS as readonly number[]).includes(chapterId);
  return (templates[chapterId] || []).map((t, i) => ({
    id: `new-${chapterId}-${i}`,
    accountNumber: t.accountNumber || '',
    concept: t.concept || '',
    units: 1,
    quantity: 1,
    unitPrice: 0,
    agencyPercentage: 0,
    total: 0,
    ssPercentage: isPersonnel ? getDefaultSSRate(chapterId) : 0,
    ssCost: 0,
    irpfPercentage: isPersonnel ? getDefaultIRPFRate(chapterId) : 0,
    irpfCost: 0,
    unitType: getDefaultUnitType(chapterId),
    preWeeks: 0,
    rodWeeks: 0,
    postWeeks: 0,
    contractType: getDefaultContractType(),
    isNew: true,
  }));
};

// Convert DB line to local format
const dbToLocal = (line: DBBudgetLine): LocalBudgetLine => {
  const isPersonnel = (PERSONNEL_CHAPTERS as readonly number[]).includes(line.chapter);
  const unitType = (line.unit_type as UnitType) || getDefaultUnitType(line.chapter);
  const contractType = (line.contract_type as ContractType) || getDefaultContractType();
  return {
    id: line.id,
    accountNumber: line.account_number || '',
    concept: line.concept,
    units: Number(line.units) || 1,
    quantity: Number(line.quantity) || 1,
    unitPrice: Number(line.unit_price) || 0,
    agencyPercentage: Number(line.agency_percentage) || 0,
    total: Number(line.total) || 0,
    ssPercentage: Number(line.social_security_percentage) || (isPersonnel ? getDefaultSSRate(line.chapter, contractType) : 0),
    ssCost: Number(line.social_security_cost) || 0,
    irpfPercentage: Number(line.irpf_percentage) || (isPersonnel ? getDefaultIRPFRate(line.chapter) : 0),
    irpfCost: Number(line.irpf_cost) || 0,
    unitType,
    preWeeks: Number(line.pre_weeks) || 0,
    rodWeeks: Number(line.rod_weeks) || 0,
    postWeeks: Number(line.post_weeks) || 0,
    contractType,
    isNew: false,
  };
};

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null);
  const [showDataCheck, setShowDataCheck] = useState(false);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('medio');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeChapter, setActiveChapter] = useState<string>("1");
  
  // Versioning state
  const { data: versions = [], isLoading: versionsLoading } = useBudgetVersions(projectId);
  const createVersion = useCreateBudgetVersion();
  const deleteVersion = useDeleteBudgetVersion();
  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [versionNotes, setVersionNotes] = useState('');
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

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

  // Generate budget using AI (edge function with Lovable AI)
  const handleGenerateWithAI = async () => {
    if (!projectId) return;
    
    setIsGeneratingAI(true);
    setShowAIPanel(false);
    setAiWarnings([]);
    setAiRecommendations([]);
    
    try {
      // Fetch all project data
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
      
      // Require at least characters for AI generation
      if (!availability.hasCharacters) {
        toast({
          title: 'Sin datos suficientes',
          description: 'Primero analiza el guión para generar un presupuesto con IA.',
          variant: 'destructive',
        });
        setIsGeneratingAI(false);
        return;
      }

      // Call the AI edge function
      const aiResponse: AIBudgetResponse = await generarPresupuestoConIA(
        projectId,
        input,
        budgetLevel,
        project?.project_type || 'largometraje'
      );

      // Save the budget lines
      if (aiResponse.budgetLines && aiResponse.budgetLines.length > 0) {
        await bulkCreate.mutateAsync({ 
          projectId, 
          lines: aiResponse.budgetLines 
        });
        
        setShowEmptyState(false);
        
        // Store warnings and recommendations
        if (aiResponse.summary) {
          setAiWarnings(aiResponse.summary.warnings || []);
          setAiRecommendations(aiResponse.summary.recommendations || []);
          if (aiResponse.summary.warnings?.length > 0 || aiResponse.summary.recommendations?.length > 0) {
            setShowAIPanel(true);
          }
        }
        
        toast({
          title: '✓ Presupuesto generado con IA',
          description: `Se crearon ${aiResponse.budgetLines.length} partidas (nivel ${budgetLevel})`,
        });
      }
    } catch (error) {
      console.error('Error generating AI budget:', error);
      toast({
        title: 'Error al generar con IA',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveLine = async (chapterId: number, line: LocalBudgetLine) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      // Exclude 'total' as it's a generated column in the database
      const isPersonnel = (PERSONNEL_CHAPTERS as readonly number[]).includes(chapterId);
      const lineData = {
        account_number: line.accountNumber,
        concept: line.concept,
        units: line.units,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        agency_percentage: line.agencyPercentage,
        chapter: chapterId,
        // Personnel SS/IRPF fields
        social_security_percentage: isPersonnel ? line.ssPercentage : 0,
        social_security_cost: isPersonnel ? line.ssCost : 0,
        irpf_percentage: isPersonnel ? line.irpfPercentage : 0,
        irpf_cost: isPersonnel ? line.irpfCost : 0,
        // New fields
        unit_type: line.unitType,
        pre_weeks: line.preWeeks,
        rod_weeks: line.rodWeeks,
        post_weeks: line.postWeeks,
        contract_type: line.contractType,
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

  const handleUpdateLine = (chapterId: number, lineId: string, field: keyof LocalBudgetLine, value: string | number) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;

      return {
        ...ch,
        lines: ch.lines.map(line => {
          if (line.id !== lineId) return line;

          const updated = { ...line, [field]: value };

          // When contract type changes, update SS% to match
          if (field === 'contractType') {
            const ct = value as ContractType;
            updated.ssPercentage = SS_TOTAL_BY_CONTRACT[ct] ?? updated.ssPercentage;
          }

          // When unit type changes to T/A, reset phase fields
          if (field === 'unitType' && value === 'TA') {
            updated.preWeeks = 0;
            updated.rodWeeks = 0;
            updated.postWeeks = 0;
          }

          const isPersonnel = (PERSONNEL_CHAPTERS as readonly number[]).includes(chapterId);

          if (isPersonnel) {
            // Use the calculator service for personnel chapters
            const result = recalculatePersonnelCosts({
              unitType: updated.unitType,
              unitPrice: updated.unitPrice,
              units: updated.units,
              quantity: updated.quantity,
              agencyPercentage: updated.agencyPercentage,
              ssPercentage: updated.ssPercentage,
              irpfPercentage: updated.irpfPercentage,
              preWeeks: updated.preWeeks,
              rodWeeks: updated.rodWeeks,
              postWeeks: updated.postWeeks,
              chapter: chapterId,
            });

            updated.ssCost = result.ssCost;
            updated.irpfCost = result.irpfCost;
            updated.units = result.effectiveUnits;
            updated.quantity = result.effectiveQuantity;
            // Total = remuneration (for the DB GENERATED column: units * quantity * unit_price * (1 + ag%))
            updated.total = result.grossRemuneration;
          } else {
            // Non-personnel: standard calculation
            const remuneration = updated.units * updated.quantity * updated.unitPrice;
            updated.total = remuneration * (1 + updated.agencyPercentage / 100);
          }

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

      const isPersonnel = (PERSONNEL_CHAPTERS as readonly number[]).includes(chapterId);
      const newLine: LocalBudgetLine = {
        id: `new-${chapterId}-${Date.now()}`,
        accountNumber: `${chapterId.toString().padStart(2, '0')}.${(ch.lines.length + 1).toString().padStart(2, '0')}`,
        concept: 'Nueva partida',
        units: 1,
        quantity: 1,
        unitPrice: 0,
        agencyPercentage: 0,
        total: 0,
        ssPercentage: isPersonnel ? getDefaultSSRate(chapterId) : 0,
        ssCost: 0,
        irpfPercentage: isPersonnel ? getDefaultIRPFRate(chapterId) : 0,
        irpfCost: 0,
        unitType: getDefaultUnitType(chapterId),
        preWeeks: 0,
        rodWeeks: 0,
        postWeeks: 0,
        contractType: getDefaultContractType(),
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

  // Flexible Excel parser for ICAA format
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const lines: { chapter: number; account_number: string; concept: string; units: number; quantity: number; unit_price: number; agency_percentage: number }[] = [];
      const chapterLineCount: Record<number, number> = {};

      // Parse number from various formats
      const parseNumber = (val: unknown): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = String(val).replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
        return parseFloat(str) || 0;
      };

      // Process all sheets (CAPITULO 01, CAPITULO 02, etc.)
      for (const sheetName of workbook.SheetNames) {
        // Detect chapter from sheet name
        const chapterMatch = sheetName.match(/CAPITULO\s*(\d{1,2})/i);
        const sheetChapter = chapterMatch ? parseInt(chapterMatch[1]) : null;
        
        // Skip non-chapter sheets (PRESENTACION, INSTRUCCIONES, RESUMEN, etc.)
        if (!sheetChapter && !sheetName.match(/RESUMEN/i)) continue;
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        let currentChapter = sheetChapter || 1;

        // Column detection for ICAA format
        let colMap = {
          account: -1,      // Núm. cuenta
          concept: -1,      // Description
          units: -1,        // UD (Días, etc.)
          quantity: -1,     // X
          unitPrice: -1,    // €
          agency: -1,       // AG (%)
          total: -1,        // REMUNERACIONES BRUTAS or ESPAÑA
        };

        // ICAA column variants
        const accountVariants = ['núm. cuenta', 'num. cuenta', 'núm cuenta', 'cuenta', 'nº'];
        const unitsVariants = ['ud', 'unidades', 'días', 'dias'];
        const quantityVariants = ['x', 'cantidad', 'qty'];
        const priceVariants = ['€', 'precio', '€/ud', 'coste'];
        const agencyVariants = ['ag', 'ag%', 'agencia'];
        const totalVariants = ['remuneraciones brutas', 'españa', 'total', 'importe'];

        // Find column indices from header rows
        for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row) continue;
          
          for (let j = 0; j < row.length; j++) {
            const cell = String(row[j] || '').toLowerCase().trim();
            
            if (accountVariants.some(v => cell.includes(v)) && colMap.account === -1) {
              colMap.account = j;
            }
            if (unitsVariants.some(v => cell === v) && colMap.units === -1) {
              colMap.units = j;
            }
            if (quantityVariants.some(v => cell === v) && colMap.quantity === -1) {
              colMap.quantity = j;
            }
            if (priceVariants.some(v => cell === v || cell.startsWith(v)) && colMap.unitPrice === -1) {
              colMap.unitPrice = j;
            }
            if (agencyVariants.some(v => cell === v || cell.startsWith(v)) && colMap.agency === -1) {
              colMap.agency = j;
            }
            if (totalVariants.some(v => cell.includes(v)) && colMap.total === -1) {
              colMap.total = j;
            }
          }
        }

        // Parse data rows
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every(cell => cell == null || String(cell).trim() === '')) continue;

          // Check for chapter header in row
          const rowText = row.map(c => String(c || '')).join(' ').toUpperCase();
          const chapterInRow = rowText.match(/CAP[ÍITU\.\s]*(\d{1,2})|CAPITULO\s*(\d{1,2})/);
          if (chapterInRow) {
            const ch = parseInt(chapterInRow[1] || chapterInRow[2]);
            if (ch >= 1 && ch <= 12) currentChapter = ch;
          }

          // Skip headers, totals, and empty conceptual rows
          if (rowText.includes('TOTAL CAPITULO') || 
              rowText.includes('SUMA Y SIGUE') || 
              rowText.includes('SUMA ANTERIOR') ||
              rowText.includes('REMUNERACIONES BRUTAS') ||
              rowText.includes('I.R.P.F.') ||
              rowText.includes('SEG.SOCIAL') ||
              rowText.includes('DIETAS')) continue;

          // Get account number from first cell or account column
          let accountNumber = '';
          const firstCell = String(row[0] || '').trim();
          const accountMatch = firstCell.match(/^(\d{1,2})[\.\-](\d{1,2})[\.\-]?(\d{1,2})?/);
          
          if (accountMatch) {
            const chap = parseInt(accountMatch[1]);
            if (chap >= 1 && chap <= 12) currentChapter = chap;
            accountNumber = `${accountMatch[1].padStart(2, '0')}.${accountMatch[2].padStart(2, '0')}`;
          } else if (colMap.account >= 0 && row[colMap.account]) {
            const accStr = String(row[colMap.account]).trim();
            const accMatch = accStr.match(/(\d{1,2})[\.\-](\d{1,2})/);
            if (accMatch) {
              accountNumber = `${accMatch[1].padStart(2, '0')}.${accMatch[2].padStart(2, '0')}`;
              const ch = parseInt(accMatch[1]);
              if (ch >= 1 && ch <= 12) currentChapter = ch;
            }
          }

          // Skip if no account number (not a budget line)
          if (!accountNumber) continue;

          // Get concept (usually second column)
          let concept = '';
          for (let j = 1; j < Math.min(4, row.length); j++) {
            const cell = String(row[j] || '').trim();
            // Skip markers like "+ D", "*", etc.
            if (cell.length > 3 && !cell.match(/^[\+\*\s\-]+[DdSs]?$/) && isNaN(Number(cell.replace(/[.,\s€]/g, '')))) {
              // Remove trailing dots
              concept = cell.replace(/\.+$/, '').replace(/…+$/, '').trim();
              break;
            }
          }

          // Skip if concept is just a placeholder
          if (!concept || concept === '*' || concept.length < 2) continue;

          // Extract numeric values
          let units = 1;
          let quantity = 1;
          let unitPrice = 0;
          let agencyPct = 0;
          let total = 0;

          if (colMap.units >= 0) units = parseNumber(row[colMap.units]) || 1;
          if (colMap.quantity >= 0) quantity = parseNumber(row[colMap.quantity]) || 1;
          if (colMap.unitPrice >= 0) unitPrice = parseNumber(row[colMap.unitPrice]);
          if (colMap.agency >= 0) {
            const agVal = parseNumber(row[colMap.agency]);
            agencyPct = agVal > 1 ? agVal : agVal * 100; // Handle both 15 and 0.15 formats
          }
          if (colMap.total >= 0) total = parseNumber(row[colMap.total]);

          // Look for numbers in row if columns not detected
          if (total === 0) {
            for (let j = row.length - 1; j >= 2; j--) {
              const num = parseNumber(row[j]);
              if (num >= 50 && !String(row[j]).includes('%')) {
                total = num;
                break;
              }
            }
          }

          // Calculate missing values
          if (total > 0 && unitPrice === 0 && units > 0 && quantity > 0) {
            // Total might include agency, so reverse calculate
            const multiplier = 1 + (agencyPct / 100);
            unitPrice = total / (units * quantity * multiplier);
          }

          // Skip lines with no value
          if (total === 0 && unitPrice === 0) continue;

          lines.push({
            chapter: currentChapter,
            account_number: accountNumber,
            concept,
            units,
            quantity,
            unit_price: Math.round(unitPrice * 100) / 100,
            agency_percentage: agencyPct,
            // DO NOT include total - it's a generated column in the database
          });
        }
      }

      if (lines.length === 0) {
        toast({
          title: 'No se encontraron partidas',
          description: 'El archivo no contiene datos reconocibles. Asegúrate de que tiene el formato ICAA con hojas por capítulo.',
          variant: 'destructive',
        });
        return;
      }

      // Bulk insert (without total field)
      await bulkCreate.mutateAsync({ projectId, lines });
      setShowEmptyState(false);
      
      // Count unique chapters
      const uniqueChapters = new Set(lines.map(l => l.chapter)).size;
      
      toast({
        title: '✓ Excel importado',
        description: `Se importaron ${lines.length} partidas en ${uniqueChapters} capítulos`,
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast({
        title: 'Error al importar',
        description: 'No se pudo leer el archivo Excel. Verifica que tiene el formato correcto.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // === Version handlers ===
  const handleSaveVersion = async () => {
    if (!projectId) return;
    setIsSavingVersion(true);
    try {
      // Build snapshot from current chapters
      const snapshot = chapters.map(ch => ({
        id: ch.id,
        name: ch.name,
        lines: ch.lines.map(l => ({
          accountNumber: l.accountNumber,
          concept: l.concept,
          units: l.units,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          agencyPercentage: l.agencyPercentage,
          total: l.total,
          ssPercentage: l.ssPercentage,
          ssCost: l.ssCost,
          irpfPercentage: l.irpfPercentage,
          irpfCost: l.irpfCost,
          unitType: l.unitType,
          preWeeks: l.preWeeks,
          rodWeeks: l.rodWeeks,
          postWeeks: l.postWeeks,
          contractType: l.contractType,
        })),
      }));

      const total = chapters.reduce((s, ch) => s + ch.lines.reduce((s2, l) => s2 + l.total, 0), 0);

      await createVersion.mutateAsync({
        projectId,
        versionName: versionName || undefined,
        notes: versionNotes || undefined,
        budgetJson: { chapters: snapshot } as unknown as import('@/integrations/supabase/types').Json,
        totalAmount: total,
      });

      setShowSaveVersionDialog(false);
      setVersionName('');
      setVersionNotes('');
      toast({ title: '✓ Versión guardada' });
    } catch (error) {
      console.error('Error saving version:', error);
      toast({ title: 'Error al guardar versión', variant: 'destructive' });
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    if (!projectId) return;
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    try {
      const json = version.budget_json as unknown as BudgetVersionSnapshot | null;
      if (!json?.chapters) {
        toast({ title: 'Formato de versión no válido', variant: 'destructive' });
        return;
      }

      // Convert snapshot back to budget_lines format for bulk insert
      const lines: { chapter: number; account_number: string; concept: string; units: number; quantity: number; unit_price: number; agency_percentage: number; social_security_percentage?: number; social_security_cost?: number; irpf_percentage?: number; irpf_cost?: number; unit_type?: string; pre_weeks?: number; rod_weeks?: number; post_weeks?: number; contract_type?: string }[] = [];
      for (const ch of json.chapters) {
        for (const line of ch.lines) {
          lines.push({
            chapter: ch.id,
            account_number: line.accountNumber,
            concept: line.concept,
            units: line.units,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            agency_percentage: line.agencyPercentage,
            social_security_percentage: line.ssPercentage ?? 0,
            social_security_cost: line.ssCost ?? 0,
            irpf_percentage: line.irpfPercentage ?? 0,
            irpf_cost: line.irpfCost ?? 0,
            unit_type: line.unitType ?? 'SEM',
            pre_weeks: line.preWeeks ?? 0,
            rod_weeks: line.rodWeeks ?? 0,
            post_weeks: line.postWeeks ?? 0,
            contract_type: line.contractType ?? 'indefinido',
          });
        }
      }

      await bulkCreate.mutateAsync({ projectId, lines });
      setShowEmptyState(false);
      toast({
        title: '✓ Versión restaurada',
        description: `Se cargó "${version.version_name || `v${version.version_number}`}" con ${lines.length} partidas`,
      });
    } catch (error) {
      console.error('Error loading version:', error);
      toast({ title: 'Error al cargar versión', variant: 'destructive' });
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!projectId) return;
    try {
      await deleteVersion.mutateAsync({ id: versionId, projectId });
      if (compareVersionId === versionId) setCompareVersionId(null);
      toast({ title: '✓ Versión eliminada' });
    } catch (error) {
      toast({ title: 'Error al eliminar versión', variant: 'destructive' });
    }
  };

  const getCompareVersion = () => {
    if (!compareVersionId) return null;
    return versions.find(v => v.id === compareVersionId) || null;
  };

  const getCompareChapterTotal = (chapterId: number): number | null => {
    const version = getCompareVersion();
    if (!version) return null;
    const json = version.budget_json as unknown as BudgetVersionSnapshot | null;
    if (!json?.chapters) return null;
    const ch = json.chapters.find((c) => c.id === chapterId);
    if (!ch) return 0;
    return ch.lines.reduce((s, l) => s + (l.total || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDiffBadge = (current: number, previous: number | null) => {
    if (previous === null) return null;
    const diff = current - previous;
    const pct = previous > 0 ? ((diff / previous) * 100) : 0;
    if (Math.abs(diff) < 1) return null;
    const isUp = diff > 0;
    return (
      <Badge variant="outline" className={`ml-2 text-xs ${isUp ? 'border-destructive/50 text-destructive' : 'border-emerald-500/50 text-emerald-600'}`}>
        {isUp ? '+' : ''}{pct.toFixed(1)}%
      </Badge>
    );
  };

  const getChapterTotal = (chapter: BudgetChapter) =>
    chapter.lines.reduce((sum, line) => sum + line.total, 0);

  // Calculate accumulated SS costs for personnel chapters → flows to Chapter 10
  const getChapterSSTotal = (chapterId: number) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return 0;
    return ch.lines.reduce((sum, line) => sum + (line.ssCost || 0), 0);
  };

  // Calculate accumulated IRPF costs for personnel chapters → flows to Chapter 10
  const getChapterIRPFTotal = (chapterId: number) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return 0;
    return ch.lines.reduce((sum, line) => sum + (line.irpfCost || 0), 0);
  };

  // Total SS from all personnel chapters (for Chapter 10)
  const totalSSCap02 = getChapterSSTotal(2);
  const totalSSCap03 = getChapterSSTotal(3);
  const totalIRPFCap02 = getChapterIRPFTotal(2);
  const totalIRPFCap03 = getChapterIRPFTotal(3);
  const totalSSAllPersonnel = totalSSCap02 + totalSSCap03;
  const totalIRPFAllPersonnel = totalIRPFCap02 + totalIRPFCap03;

  // Chapter 10 effective total includes auto-calculated SS/IRPF lines
  const getChapter10EffectiveTotal = () => {
    const ch10 = chapters.find(c => c.id === 10);
    const manualTotal = ch10 ? getChapterTotal(ch10) : 0;
    return manualTotal + totalSSAllPersonnel + totalIRPFAllPersonnel;
  };

  // Grand total includes Chapter 10 auto-lines
  const grandTotal = chapters.reduce((sum, ch) => {
    if (ch.id === 10) return sum + getChapter10EffectiveTotal();
    return sum + getChapterTotal(ch);
  }, 0);

  // Calculate executive summary stats
  const shootingDays = (() => {
    // Try to find shooting days from chapter 3 (technical team) or chapter 7 (travel/hotels)
    const chapter3 = chapters.find(ch => ch.id === 3);
    const chapter7 = chapters.find(ch => ch.id === 7);
    
    // Look for lines with "días" pattern in concept or use units
    const techLines = chapter3?.lines.filter(l => l.total > 0) || [];
    const travelLines = chapter7?.lines.filter(l => l.total > 0) || [];
    
    // Use maximum units from technical team as shooting days estimate
    const maxTechDays = Math.max(...techLines.map(l => l.units), 0);
    const maxTravelDays = Math.max(...travelLines.map(l => l.quantity), 0);
    
    return Math.max(maxTechDays, maxTravelDays, 1);
  })();

  const costPerDay = shootingDays > 0 ? grandTotal / shootingDays : 0;

  const postProductionWeeks = (() => {
    // Estimate from chapter 9 (lab/post) and chapter 3 (editor)
    const chapter9 = chapters.find(ch => ch.id === 9);
    const chapter3 = chapters.find(ch => ch.id === 3);
    
    const postLines = chapter9?.lines.filter(l => l.total > 0) || [];
    const editorLine = chapter3?.lines.find(l => 
      l.concept.toLowerCase().includes('montador') || 
      l.concept.toLowerCase().includes('editor')
    );
    
    // Use editor days/5 or estimate from post budget
    if (editorLine && editorLine.units > 0) {
      return Math.ceil(editorLine.units / 5);
    }
    
    // Fallback: estimate based on total post budget
    const postTotal = postLines.reduce((sum, l) => sum + l.total, 0);
    return Math.max(Math.ceil(postTotal / 15000), 4); // Assume ~15k/week or minimum 4 weeks
  })();

  const projectTitle = project?.title || 'Mi Proyecto';
  const estimatedBudgetRange = project?.creative_analysis?.estimated_budget_range;

  // Check if we have any real budget data
  const hasRealBudgetData = dbLines.length > 0 && grandTotal > 0;

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

        {/* AI Estimated Budget Range from Script Analysis */}
        {estimatedBudgetRange && (
          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-medium">Estimación IA del guión</AlertTitle>
            <AlertDescription className="text-sm">
              Rango presupuestario estimado: <span className="font-semibold text-primary">{estimatedBudgetRange}</span>
              {hasRealBudgetData && grandTotal > 0 && (
                <span className="ml-2 text-muted-foreground">
                  — Tu presupuesto actual: {formatCurrency(grandTotal)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Executive Summary Panel - Show when we have budget data */}
        {hasRealBudgetData && !showEmptyState && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Presupuesto</p>
                    <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Días de Rodaje</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{shootingDays}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Film className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coste / Día</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(costPerDay)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Semanas Postpro.</p>
                    <p className="text-2xl font-bold text-violet-600 mt-1">{postProductionWeeks}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                
                {/* Budget Level Selector for Empty State */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Nivel de presupuesto:</span>
                  <Select value={budgetLevel} onValueChange={(v) => setBudgetLevel(v as BudgetLevel)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bajo">🟢 Bajo</SelectItem>
                      <SelectItem value="medio">🟠 Medio</SelectItem>
                      <SelectItem value="alto">🔴 Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-4 md:grid-cols-4 max-w-3xl mx-auto">
                  {/* AI Generation - Primary */}
                  <Button 
                    variant="default"
                    className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-primary to-primary/80"
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Zap className="w-6 h-6" />
                    )}
                    <span className="font-semibold">Generar con IA</span>
                    <span className="text-xs opacity-80">Presupuesto inteligente</span>
                  </Button>
                  
                  {/* Quick Estimation */}
                  <Button 
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={handleCheckDataAndGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                    <span className="font-semibold">Estimación rápida</span>
                    <span className="text-xs opacity-80">Sin IA, datos locales</span>
                  </Button>
                  
                  {/* Import Excel */}
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
                    <span className="text-xs opacity-80">Proyecto de referencia</span>
                  </Button>
                  
                  {/* Start from scratch */}
                  <Button 
                    variant="ghost"
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setShowEmptyState(false)}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="font-semibold">Desde cero</span>
                    <span className="text-xs opacity-80">Manual</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Warnings & Recommendations Panel */}
        {showAIPanel && (aiWarnings.length > 0 || aiRecommendations.length > 0) && (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 font-semibold">
              Avisos del análisis IA
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-3">
                {aiWarnings.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-1">⚠️ Advertencias:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      {aiWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiRecommendations.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-1">💡 Recomendaciones:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      {aiRecommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="mt-3"
                onClick={() => setShowAIPanel(false)}
              >
                Cerrar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary & Actions - Always visible */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Header Row */}
              <div className="flex items-center justify-between flex-wrap gap-4">
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
              
              {/* Actions Row */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  {/* Budget Level Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Nivel:</span>
                    <Select value={budgetLevel} onValueChange={(v) => setBudgetLevel(v as BudgetLevel)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bajo">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Bajo
                          </span>
                        </SelectItem>
                        <SelectItem value="medio">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Medio
                          </span>
                        </SelectItem>
                        <SelectItem value="alto">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Alto
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                  
                  {/* AI Generation Button */}
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-primary to-primary/80"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Generar con IA
                  </Button>
                  
                  {/* Local Estimation Button */}
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
                    Estimación rápida
                  </Button>
                  
                  {/* Import Excel Button */}
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
                    Importar
                  </Button>
                  
                  {/* Regenerate Button - only when budget exists */}
                  {!showEmptyState && dbLines.length > 0 && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateWithAI}
                      disabled={isGeneratingAI}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                      Regenerar
                    </Button>
                  )}
                  
                  {/* Version Buttons */}
                  {!showEmptyState && dbLines.length > 0 && (
                    <>
                      <div className="w-px h-6 bg-border" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSaveVersionDialog(true)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar versión
                      </Button>
                      <Button
                        variant={showVersionsPanel ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setShowVersionsPanel(!showVersionsPanel)}
                      >
                        <History className="w-4 h-4 mr-2" />
                        Versiones
                        {versions.length > 0 && (
                          <Badge variant="secondary" className="ml-1">{versions.length}</Badge>
                        )}
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Budget Level Badge */}
                <Badge variant="outline" className="text-sm">
                  {budgetLevel === 'bajo' && '💚 Presupuesto Bajo'}
                  {budgetLevel === 'medio' && '🧡 Presupuesto Medio'}
                  {budgetLevel === 'alto' && '❤️ Presupuesto Alto'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chapters with Tabs Navigation */}
        {!showEmptyState && (
          <Tabs value={activeChapter} onValueChange={setActiveChapter} className="w-full">
            {/* Scrollable Tab Bar */}
            <Card className="mb-4">
              <CardContent className="p-2">
                <ScrollArea className="w-full whitespace-nowrap">
                  <TabsList className="inline-flex h-auto p-1 bg-muted/50 w-max">
                    {chapters.map((chapter) => {
                      const chapterTotal = chapter.id === 10 ? getChapter10EffectiveTotal() : getChapterTotal(chapter);
                      const hasData = chapterTotal > 0;
                      const compareTotal = getCompareChapterTotal(chapter.id);
                      return (
                        <TabsTrigger
                          key={chapter.id}
                          value={chapter.id.toString()}
                          className="flex flex-col items-center gap-1 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm min-w-[100px]"
                        >
                          <span className="text-xs font-medium">CAP. {chapter.id.toString().padStart(2, '0')}</span>
                          <span className={`text-xs ${hasData ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            {chapterTotal > 0 ? formatCurrency(chapterTotal) : '—'}
                          </span>
                          {compareTotal !== null && formatDiffBadge(chapterTotal, compareTotal)}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Tab Content for each chapter */}
            {chapters.map((chapter) => (
              <TabsContent key={chapter.id} value={chapter.id.toString()} className="mt-0">
                <Card>
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {chapter.name}
                        <Badge variant="secondary">{chapter.lines.length} partidas</Badge>
                        {(PERSONNEL_CHAPTERS as readonly number[]).includes(chapter.id) && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            SS+IRPF → Cap.10
                          </Badge>
                        )}
                      </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(chapter.id === 10 ? getChapter10EffectiveTotal() : getChapterTotal(chapter))}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Núm.</TableHead>
                          <TableHead>Concepto</TableHead>
                          {(PERSONNEL_CHAPTERS as readonly number[]).includes(chapter.id) && (
                            <>
                              <TableHead className="w-24">Tipo</TableHead>
                              <TableHead className="w-20">Contrato</TableHead>
                            </>
                          )}
                          {/* Cap 03: PRE/ROD/POST columns */}
                          {chapter.id === 3 && (
                            <>
                              <TableHead className="w-16 text-right">PRE</TableHead>
                              <TableHead className="w-16 text-right">ROD</TableHead>
                              <TableHead className="w-16 text-right">POST</TableHead>
                            </>
                          )}
                          {/* Cap 02 or non-personnel: UD/X columns */}
                          {chapter.id !== 3 && (
                            <>
                              <TableHead className="w-20 text-right">UD</TableHead>
                              <TableHead className="w-20 text-right">X</TableHead>
                            </>
                          )}
                          <TableHead className="w-28 text-right">€/Ud</TableHead>
                          <TableHead className="w-20 text-right">AG%</TableHead>
                          {(PERSONNEL_CHAPTERS as readonly number[]).includes(chapter.id) && (
                            <>
                              <TableHead className="w-20 text-right">SS%</TableHead>
                              <TableHead className="w-24 text-right">SS €</TableHead>
                              <TableHead className="w-20 text-right">IRPF%</TableHead>
                              <TableHead className="w-24 text-right">IRPF €</TableHead>
                            </>
                          )}
                          <TableHead className="w-28 text-right">TOTAL</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chapter.lines.map((line) => {
                          const isPersonnelCh = (PERSONNEL_CHAPTERS as readonly number[]).includes(chapter.id);
                          const isTantoAlzado = line.unitType === 'TA';
                          const totalPeriods = chapter.id === 3 && !isTantoAlzado
                            ? calculateTotalPeriods(line.unitType, line.preWeeks, line.rodWeeks, line.postWeeks)
                            : line.units * line.quantity;

                          return (
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
                            {/* Personnel: Unit Type + Contract Type selectors */}
                            {isPersonnelCh && (
                              <>
                                <TableCell>
                                  <Select
                                    value={line.unitType}
                                    onValueChange={(v) => {
                                      handleUpdateLine(chapter.id, line.id, 'unitType', v);
                                      // Auto-save after change
                                      setTimeout(() => {
                                        const ch = chapters.find(c => c.id === chapter.id);
                                        const updatedLine = ch?.lines.find(l => l.id === line.id);
                                        if (updatedLine) handleLineBlur(chapter.id, updatedLine);
                                      }, 100);
                                    }}
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(UNIT_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={line.contractType}
                                    onValueChange={(v) => {
                                      handleUpdateLine(chapter.id, line.id, 'contractType', v);
                                      setTimeout(() => {
                                        const ch = chapters.find(c => c.id === chapter.id);
                                        const updatedLine = ch?.lines.find(l => l.id === line.id);
                                        if (updatedLine) handleLineBlur(chapter.id, updatedLine);
                                      }, 100);
                                    }}
                                  >
                                    <SelectTrigger className="w-20 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="indefinido">Indef.</SelectItem>
                                      <SelectItem value="temporal">Temp.</SelectItem>
                                      <SelectItem value="autonomo">Autón.</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </>
                            )}
                            {/* Cap 03: PRE/ROD/POST inputs or "T/A" label */}
                            {chapter.id === 3 && (
                              isTantoAlzado ? (
                                <>
                                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground italic">
                                    Tanto Alzado
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      value={line.preWeeks}
                                      onChange={(e) => handleUpdateLine(chapter.id, line.id, 'preWeeks', parseFloat(e.target.value) || 0)}
                                      onBlur={() => handleLineBlur(chapter.id, line)}
                                      className="w-14 text-right text-xs"
                                      placeholder="0"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      value={line.rodWeeks}
                                      onChange={(e) => handleUpdateLine(chapter.id, line.id, 'rodWeeks', parseFloat(e.target.value) || 0)}
                                      onBlur={() => handleLineBlur(chapter.id, line)}
                                      className="w-14 text-right text-xs"
                                      placeholder="0"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      value={line.postWeeks}
                                      onChange={(e) => handleUpdateLine(chapter.id, line.id, 'postWeeks', parseFloat(e.target.value) || 0)}
                                      onBlur={() => handleLineBlur(chapter.id, line)}
                                      className="w-14 text-right text-xs"
                                      placeholder="0"
                                    />
                                  </TableCell>
                                </>
                              )
                            )}
                            {/* Cap 02 or non-personnel: UD/X */}
                            {chapter.id !== 3 && (
                              <>
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
                              </>
                            )}
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
                            {isPersonnelCh && (
                              <>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={line.ssPercentage}
                                    onChange={(e) => handleUpdateLine(chapter.id, line.id, 'ssPercentage', parseFloat(e.target.value) || 0)}
                                    onBlur={() => handleLineBlur(chapter.id, line)}
                                    className="w-16 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {formatCurrency(line.ssCost)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={line.irpfPercentage}
                                    onChange={(e) => handleUpdateLine(chapter.id, line.id, 'irpfPercentage', parseFloat(e.target.value) || 0)}
                                    onBlur={() => handleLineBlur(chapter.id, line)}
                                    className="w-16 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {formatCurrency(line.irpfCost)}
                                </TableCell>
                              </>
                            )}
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
                          );
                        })}

                        {/* Personnel chapters: show SS/IRPF summary row */}
                        {(PERSONNEL_CHAPTERS as readonly number[]).includes(chapter.id) && chapter.lines.some(l => l.ssCost > 0 || l.irpfCost > 0) && (
                          <TableRow className="bg-amber-50/50 dark:bg-amber-950/20 border-t-2">
                            <TableCell colSpan={chapter.id === 3 ? 9 : 8} className="text-right text-sm font-medium text-amber-700 dark:text-amber-400">
                              Totales SS + IRPF (→ Cap. 10):
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-amber-700 dark:text-amber-400">
                              {/* SS% column - empty */}
                            </TableCell>
                            <TableCell className="text-right text-sm font-bold text-amber-700 dark:text-amber-400">
                              {formatCurrency(getChapterSSTotal(chapter.id))}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-amber-700 dark:text-amber-400">
                              {/* IRPF% column - empty */}
                            </TableCell>
                            <TableCell className="text-right text-sm font-bold text-amber-700 dark:text-amber-400">
                              {formatCurrency(getChapterIRPFTotal(chapter.id))}
                            </TableCell>
                            <TableCell className="text-right text-sm font-bold text-amber-700 dark:text-amber-400">
                              {formatCurrency(getChapterSSTotal(chapter.id) + getChapterIRPFTotal(chapter.id))}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}

                        {/* Chapter 10: show auto-calculated SS/IRPF lines from personnel chapters */}
                        {chapter.id === 10 && (totalSSAllPersonnel > 0 || totalIRPFAllPersonnel > 0) && (
                          <>
                            <TableRow className="bg-blue-50/50 dark:bg-blue-950/20 border-t-2">
                              <TableCell colSpan={6} className="text-sm font-medium">
                                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">Auto</Badge>
                                  Líneas calculadas desde Capítulos 02 y 03
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">
                                {formatCurrency(totalSSAllPersonnel + totalIRPFAllPersonnel)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                            {totalSSCap02 > 0 && (
                              <TableRow className="bg-blue-50/30 dark:bg-blue-950/10">
                                <TableCell className="font-mono text-sm text-muted-foreground pl-8">10.A1</TableCell>
                                <TableCell className="text-sm text-muted-foreground" colSpan={4}>SS Personal Artístico (Cap. 02)</TableCell>
                                <TableCell />
                                <TableCell className="text-right text-sm font-medium">{formatCurrency(totalSSCap02)}</TableCell>
                                <TableCell />
                              </TableRow>
                            )}
                            {totalSSCap03 > 0 && (
                              <TableRow className="bg-blue-50/30 dark:bg-blue-950/10">
                                <TableCell className="font-mono text-sm text-muted-foreground pl-8">10.A2</TableCell>
                                <TableCell className="text-sm text-muted-foreground" colSpan={4}>SS Equipo Técnico (Cap. 03)</TableCell>
                                <TableCell />
                                <TableCell className="text-right text-sm font-medium">{formatCurrency(totalSSCap03)}</TableCell>
                                <TableCell />
                              </TableRow>
                            )}
                            {totalIRPFCap02 > 0 && (
                              <TableRow className="bg-blue-50/30 dark:bg-blue-950/10">
                                <TableCell className="font-mono text-sm text-muted-foreground pl-8">10.A3</TableCell>
                                <TableCell className="text-sm text-muted-foreground" colSpan={4}>IRPF Personal Artístico (Cap. 02)</TableCell>
                                <TableCell />
                                <TableCell className="text-right text-sm font-medium">{formatCurrency(totalIRPFCap02)}</TableCell>
                                <TableCell />
                              </TableRow>
                            )}
                            {totalIRPFCap03 > 0 && (
                              <TableRow className="bg-blue-50/30 dark:bg-blue-950/10">
                                <TableCell className="font-mono text-sm text-muted-foreground pl-8">10.A4</TableCell>
                                <TableCell className="text-sm text-muted-foreground" colSpan={4}>IRPF Equipo Técnico (Cap. 03)</TableCell>
                                <TableCell />
                                <TableCell className="text-right text-sm font-medium">{formatCurrency(totalIRPFCap03)}</TableCell>
                                <TableCell />
                              </TableRow>
                            )}
                          </>
                        )}
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
                      <div className="flex items-center gap-4">
                        {/* Navigation buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={chapter.id === 1}
                            onClick={() => setActiveChapter((chapter.id - 1).toString())}
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            Anterior
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={chapter.id === 12}
                            onClick={() => setActiveChapter((chapter.id + 1).toString())}
                          >
                            Siguiente
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground mr-4">Subtotal {chapter.name.split(' - ')[0]}:</span>
                          <span className="text-lg font-bold">
                            {formatCurrency(chapter.id === 10 ? getChapter10EffectiveTotal() : getChapterTotal(chapter))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Grand Total - Hide when showing empty state */}
        {!showEmptyState && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-semibold">TOTAL GENERAL</span>
                  {compareVersionId && getCompareVersion() && (
                    <span className="text-sm text-muted-foreground ml-3">
                      vs {getCompareVersion()?.version_name || `v${getCompareVersion()?.version_number}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                  {compareVersionId && formatDiffBadge(grandTotal, Number(getCompareVersion()?.total_amount || 0))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Versions Panel */}
        {showVersionsPanel && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="w-5 h-5" />
                  Historial de versiones
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowVersionsPanel(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {compareVersionId && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="gap-1">
                    <ArrowLeftRight className="w-3 h-3" />
                    Comparando con: {getCompareVersion()?.version_name || `v${getCompareVersion()?.version_number}`}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setCompareVersionId(null)}>
                    Dejar de comparar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {versionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay versiones guardadas. Guarda una versión para poder restaurarla o compararla.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{v.version_name || `Versión ${v.version_number}`}</span>
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(Number(v.total_amount || 0))}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(v.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {v.notes && ` — ${v.notes}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant={compareVersionId === v.id ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setCompareVersionId(compareVersionId === v.id ? null : v.id)}
                          title="Comparar con versión actual"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Restaurar esta versión">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Restaurar versión?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esto reemplazará el presupuesto actual con "{v.version_name || `v${v.version_number}`}".
                                Se recomienda guardar una versión del presupuesto actual antes de restaurar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleLoadVersion(v.id)}>
                                Restaurar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Eliminar versión">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar versión?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará permanentemente "{v.version_name || `v${v.version_number}`}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteVersion(v.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Version Dialog */}
      <Dialog open={showSaveVersionDialog} onOpenChange={setShowSaveVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar versión del presupuesto</DialogTitle>
            <DialogDescription>
              Se guardará un snapshot completo del presupuesto actual ({formatCurrency(grandTotal)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="version-name">Nombre (opcional)</Label>
              <Input
                id="version-name"
                placeholder={`v${(versions[0]?.version_number ?? 0) + 1}`}
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-notes">Notas (opcional)</Label>
              <Textarea
                id="version-notes"
                placeholder="Ej: Versión pre-rodaje, ajustes post-casting..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveVersionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVersion} disabled={isSavingVersion}>
              {isSavingVersion ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProductionLayout>
  );
}
