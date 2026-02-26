import { useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Table,
  Check,
  Users,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { useBudgetLines, type BudgetLine } from '@/hooks/useBudgetLines';

const CHAPTER_NAMES: Record<number, string> = {
  1: 'Cap. 01 — Guión y Música',
  2: 'Cap. 02 — Personal Artístico',
  3: 'Cap. 03 — Equipo Técnico',
  4: 'Cap. 04 — Escenografía',
  5: 'Cap. 05 — Estudios Rodaje/Sonorización',
  6: 'Cap. 06 — Maquinaria, Rodaje y Transportes',
  7: 'Cap. 07 — Viajes, Hoteles y Comidas',
  8: 'Cap. 08 — Película Virgen / Material Sensible',
  9: 'Cap. 09 — Laboratorio / Postproducción',
  10: 'Cap. 10 — Seguros',
  11: 'Cap. 11 — Gastos Generales',
  12: 'Cap. 12 — Gastos Explotación y Financiación',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title: string) {
  return title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

// ── Build ICAA Budget Workbook ────────────────────────────────────────
function buildBudgetWorkbook(lines: BudgetLine[], projectTitle: string): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen por capítulos ──────────────────────────────────
  const chapterTotals: { chapter: number; name: string; total: number; lineCount: number }[] = [];
  for (let ch = 1; ch <= 12; ch++) {
    const chLines = lines.filter((l) => l.chapter === ch);
    const total = chLines.reduce((sum, l) => sum + (l.total ?? 0), 0);
    chapterTotals.push({ chapter: ch, name: CHAPTER_NAMES[ch], total, lineCount: chLines.length });
  }
  const grandTotal = chapterTotals.reduce((s, c) => s + c.total, 0);

  const summaryData = [
    ['PRESUPUESTO ICAA — RESUMEN POR CAPÍTULOS'],
    [`Proyecto: ${projectTitle}`],
    [`Fecha: ${new Date().toLocaleDateString('es-ES')}`],
    [],
    ['Capítulo', 'Nombre', 'N.º Partidas', 'Total (€)'],
    ...chapterTotals.map((c) => [
      String(c.chapter).padStart(2, '0'),
      c.name.replace(/^Cap\. \d{2} — /, ''),
      c.lineCount,
      c.total,
    ]),
    [],
    ['', 'TOTAL GENERAL', '', grandTotal],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // Column widths
  wsSummary['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 14 }, { wch: 16 }];

  // Number format for currency columns
  const currencyFmt = '#,##0.00 €';
  for (let r = 5; r <= 5 + chapterTotals.length; r++) {
    const cellRef = XLSX.utils.encode_cell({ r, c: 3 });
    if (wsSummary[cellRef]) wsSummary[cellRef].z = currencyFmt;
  }
  // Grand total cell
  const gtCell = XLSX.utils.encode_cell({ r: summaryData.length - 1, c: 3 });
  if (wsSummary[gtCell]) wsSummary[gtCell].z = currencyFmt;

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // ── Sheet 2: Detalle completo ───────────────────────────────────────
  const detailHeaders = [
    'Capítulo',
    'Cuenta',
    'Concepto',
    'Uds.',
    'Cantidad',
    'Precio/Ud. (€)',
    'Agencia %',
    'Coste Agencia (€)',
    'SS %',
    'Coste SS (€)',
    'Base Antes Imp. (€)',
    'Total (€)',
    'Fuente Tarifa',
    'Nivel',
    'Notas',
  ];

  const detailRows: (string | number | null)[][] = [];

  for (let ch = 1; ch <= 12; ch++) {
    const chLines = lines.filter((l) => l.chapter === ch);
    if (chLines.length === 0) continue;

    // Chapter header row
    detailRows.push([CHAPTER_NAMES[ch], '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    for (const l of chLines) {
      detailRows.push([
        String(ch).padStart(2, '0'),
        l.account_number ?? '',
        l.concept ?? '',
        l.units ?? '',
        l.quantity ?? '',
        l.unit_price ?? '',
        l.agency_percentage ?? '',
        l.agency_cost ?? '',
        l.social_security_percentage ?? '',
        l.social_security_cost ?? '',
        l.base_before_taxes ?? '',
        l.total ?? '',
        l.tariff_source ?? '',
        l.budget_level ?? '',
        l.notes ?? '',
      ]);
    }

    // Chapter subtotal
    const chTotal = chLines.reduce((s, l) => s + (l.total ?? 0), 0);
    detailRows.push(['', '', `SUBTOTAL ${CHAPTER_NAMES[ch]}`, '', '', '', '', '', '', '', '', chTotal, '', '', '']);
    detailRows.push([]); // Blank separator
  }

  // Grand total row
  detailRows.push(['', '', 'TOTAL GENERAL PRESUPUESTO', '', '', '', '', '', '', '', '', grandTotal, '', '', '']);

  const detailData = [
    ['PRESUPUESTO ICAA — DETALLE COMPLETO'],
    [`Proyecto: ${projectTitle}`],
    [],
    detailHeaders,
    ...detailRows,
  ];

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  wsDetail['!cols'] = [
    { wch: 10 }, // Capítulo
    { wch: 10 }, // Cuenta
    { wch: 40 }, // Concepto
    { wch: 6 },  // Uds
    { wch: 8 },  // Cantidad
    { wch: 14 }, // Precio
    { wch: 10 }, // Agencia %
    { wch: 14 }, // Coste Agencia
    { wch: 8 },  // SS %
    { wch: 14 }, // Coste SS
    { wch: 16 }, // Base
    { wch: 14 }, // Total
    { wch: 16 }, // Fuente
    { wch: 8 },  // Nivel
    { wch: 25 }, // Notas
  ];

  // Apply currency format to monetary columns (5,7,9,10,11 — 0-indexed)
  const moneyColIndices = [5, 7, 9, 10, 11];
  for (let r = 4; r < detailData.length; r++) {
    for (const c of moneyColIndices) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (wsDetail[cellRef] && typeof wsDetail[cellRef].v === 'number') {
        wsDetail[cellRef].z = currencyFmt;
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle ICAA');

  return wb;
}

// ── Build Characters Workbook ─────────────────────────────────────────
function buildCharactersWorkbook(
  characters: Array<{ name: string; category: string | null; description: string | null; shooting_days: number | null; daily_rate: number | null; agency_percentage: number | null }>,
  projectTitle: string,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const headers = ['Nombre', 'Categoría', 'Descripción', 'Días Rodaje', 'Tarifa/Día (€)', 'Agencia %', 'Coste Agencia (€)', 'Total (€)'];
  const rows = characters.map((c) => {
    const days = c.shooting_days ?? 0;
    const rate = c.daily_rate ?? 0;
    const agencyPct = c.agency_percentage ?? 0;
    const baseCost = days * rate;
    const agencyCost = baseCost * (agencyPct / 100);
    const total = baseCost + agencyCost;
    return [c.name, c.category ?? '', c.description ?? '', days, rate, agencyPct, agencyCost, total];
  });

  const grandTotal = rows.reduce((s, r) => s + ((r[7] as number) || 0), 0);
  rows.push(['', '', 'TOTAL', '', '', '', '', grandTotal]);

  const data = [
    ['DESGLOSE DE PERSONAJES'],
    [`Proyecto: ${projectTitle}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 25 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 14 }];

  const currencyFmt = '#,##0.00 €';
  for (let r = 4; r < data.length; r++) {
    for (const c of [4, 6, 7]) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') ws[cellRef].z = currencyFmt;
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Personajes');
  return wb;
}

// ── Build Locations Workbook ──────────────────────────────────────────
function buildLocationsWorkbook(
  locations: Array<{ name: string; location_type: string | null; complexity: string | null; estimated_days: number | null; address: string | null; zone: string | null; special_needs: string | null }>,
  projectTitle: string,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const headers = ['Localización', 'Tipo', 'Complejidad', 'Días Estimados', 'Dirección', 'Zona', 'Necesidades Especiales'];
  const rows = locations.map((l) => [
    l.name,
    l.location_type ?? '',
    l.complexity ?? '',
    l.estimated_days ?? 0,
    l.address ?? '',
    l.zone ?? '',
    l.special_needs ?? '',
  ]);

  const totalDays = rows.reduce((s, r) => s + ((r[3] as number) || 0), 0);
  rows.push(['TOTAL', '', '', totalDays, '', '', '']);

  const data = [
    ['DESGLOSE DE LOCALIZACIONES'],
    [`Proyecto: ${projectTitle}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 12 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Localizaciones');
  return wb;
}

export default function ExportExcelPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: budgetLines = [], isLoading: linesLoading } = useBudgetLines(projectId);

  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportedFormats, setExportedFormats] = useState<string[]>([]);

  const projectTitle = project?.title || 'Mi Proyecto';
  const characters = project?.characters ?? [];
  const locations = project?.locations ?? [];
  const isLoading = projectLoading || linesLoading;

  const hasData = {
    budget: budgetLines.length > 0,
    characters: characters.length > 0,
    locations: locations.length > 0,
  };

  // ── Export: Presupuesto ICAA (.xlsx) ────────────────────────────────
  const handleExportBudget = () => {
    setIsExporting('budget');
    try {
      const wb = buildBudgetWorkbook(budgetLines, projectTitle);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadBlob(blob, `presupuesto-ICAA-${sanitizeFilename(projectTitle)}.xlsx`);

      setExportedFormats((prev) => [...new Set([...prev, 'budget'])]);
      toast({ title: 'Presupuesto exportado', description: 'Archivo Excel ICAA descargado con 2 hojas: Resumen + Detalle' });
    } catch (err: unknown) {
      toast({ title: 'Error al exportar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  // ── Export: Personajes (.xlsx) ──────────────────────────────────────
  const handleExportCharacters = () => {
    setIsExporting('characters');
    try {
      const wb = buildCharactersWorkbook(characters, projectTitle);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadBlob(blob, `personajes-${sanitizeFilename(projectTitle)}.xlsx`);

      setExportedFormats((prev) => [...new Set([...prev, 'characters'])]);
      toast({ title: 'Personajes exportados', description: 'Archivo Excel con desglose de personajes' });
    } catch (err: unknown) {
      toast({ title: 'Error al exportar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  // ── Export: Localizaciones (.xlsx) ──────────────────────────────────
  const handleExportLocations = () => {
    setIsExporting('locations');
    try {
      const wb = buildLocationsWorkbook(locations, projectTitle);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadBlob(blob, `localizaciones-${sanitizeFilename(projectTitle)}.xlsx`);

      setExportedFormats((prev) => [...new Set([...prev, 'locations'])]);
      toast({ title: 'Localizaciones exportadas', description: 'Archivo Excel con desglose de localizaciones' });
    } catch (err: unknown) {
      toast({ title: 'Error al exportar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  // ── Export: JSON completo ──────────────────────────────────────────
  const handleExportJSON = () => {
    setIsExporting('json');
    try {
      const chapterSummary: Record<number, number> = {};
      for (let ch = 1; ch <= 12; ch++) {
        chapterSummary[ch] = budgetLines.filter((l) => l.chapter === ch).reduce((s, l) => s + (l.total ?? 0), 0);
      }

      const data = {
        proyecto: projectTitle,
        fecha: new Date().toISOString(),
        presupuesto: {
          total: budgetLines.reduce((s, l) => s + (l.total ?? 0), 0),
          capitulos: Object.entries(chapterSummary).map(([ch, total]) => ({
            capitulo: Number(ch),
            nombre: CHAPTER_NAMES[Number(ch)]?.replace(/^Cap\. \d{2} — /, '') ?? '',
            total,
          })),
          lineas: budgetLines.length,
        },
        personajes: characters.map((c) => ({
          nombre: c.name,
          categoria: c.category,
          dias_rodaje: c.shooting_days,
          tarifa_dia: c.daily_rate,
        })),
        localizaciones: locations.map((l) => ({
          nombre: l.name,
          tipo: l.location_type,
          complejidad: l.complexity,
          dias_estimados: l.estimated_days,
        })),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `datos-${sanitizeFilename(projectTitle)}.json`);

      setExportedFormats((prev) => [...new Set([...prev, 'json'])]);
      toast({ title: 'JSON exportado' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'budget',
      title: 'Presupuesto ICAA (.xlsx)',
      description: 'Formato oficial con los 12 capítulos, subtotales y detalle completo en 2 hojas',
      icon: FileSpreadsheet,
      action: handleExportBudget,
      badge: 'Formato ICAA',
      hasData: hasData.budget,
      count: `${budgetLines.length} partidas`,
    },
    {
      id: 'characters',
      title: 'Desglose Personajes (.xlsx)',
      description: 'Personajes con categorías, días de rodaje, tarifas y costes de agencia',
      icon: Users,
      action: handleExportCharacters,
      badge: null,
      hasData: hasData.characters,
      count: `${characters.length} personajes`,
    },
    {
      id: 'locations',
      title: 'Desglose Localizaciones (.xlsx)',
      description: 'Localizaciones con tipo, complejidad, días estimados y zonas',
      icon: MapPin,
      action: handleExportLocations,
      badge: null,
      hasData: hasData.locations,
      count: `${locations.length} localizaciones`,
    },
    {
      id: 'json',
      title: 'Datos completos (.json)',
      description: 'Todos los datos del proyecto para integración con otras herramientas',
      icon: FileText,
      action: handleExportJSON,
      badge: 'Desarrolladores',
      hasData: true,
      count: '',
    },
  ];

  return (
    <ProductionLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-2">Exportar Documentos</h2>
          <p className="text-muted-foreground">
            Descarga el presupuesto en formato ICAA oficial y otros documentos de producción en Excel real (.xlsx)
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando datos del proyecto...</span>
          </div>
        ) : (
          <>
            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isExported = exportedFormats.includes(option.id);
                const exporting = isExporting === option.id;

                return (
                  <Card
                    key={option.id}
                    className={`hover:shadow-md transition-shadow ${isExported ? 'border-green-500/50 bg-green-500/5' : ''}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExported ? 'bg-green-500/20' : 'bg-primary/10'}`}
                        >
                          {isExported ? <Check className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <span className="flex items-center gap-2">
                            {option.title}
                            {option.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {option.badge}
                              </Badge>
                            )}
                          </span>
                        </div>
                      </CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {option.count && (
                        <p className="text-xs text-muted-foreground">{option.count}</p>
                      )}
                      {!option.hasData && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            Sin datos. Genera el contenido primero desde la sección correspondiente.
                          </AlertDescription>
                        </Alert>
                      )}
                      <Button
                        onClick={option.action}
                        disabled={exporting || !option.hasData}
                        className="w-full"
                        variant={isExported ? 'outline' : 'default'}
                      >
                        {exporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {exporting ? 'Exportando...' : isExported ? 'Descargar de nuevo' : 'Descargar .xlsx'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Info */}
            <Card className="bg-muted/30 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Los archivos Excel (.xlsx) son compatibles con las convocatorias oficiales del ICAA,
                  Creative Europe y entidades de financiación. Incluyen formato numérico en euros, subtotales por capítulo
                  y hojas separadas para resumen y detalle.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProductionLayout>
  );
}
