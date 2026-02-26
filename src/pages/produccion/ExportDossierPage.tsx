import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import { useBudgetLines } from '@/hooks/useBudgetLines';
import { generateDossierHTML } from '@/services/dossierHtmlService';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  Film,
  Users,
  MapPin,
  Palette,
  BarChart3,
  Calculator,
  FileSpreadsheet,
  CheckCircle2,
  Settings,
  Printer,
} from 'lucide-react';

interface DossierSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'creative' | 'production' | 'financing';
  selected: boolean;
}

export default function ExportDossierPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: budgetLines = [], isLoading: linesLoading } = useBudgetLines(projectId);

  const [isExporting, setIsExporting] = useState(false);
  const [sections, setSections] = useState<DossierSection[]>([
    // Creative
    { id: 'overview', title: 'Sinopsis y Logline', description: 'Resumen ejecutivo del proyecto', icon: <Film className="h-4 w-4" />, category: 'creative', selected: true },
    { id: 'characters', title: 'Personajes', description: 'Descripción y arcos dramáticos', icon: <Users className="h-4 w-4" />, category: 'creative', selected: true },
    { id: 'locations', title: 'Localizaciones', description: 'Espacios narrativos del guión', icon: <MapPin className="h-4 w-4" />, category: 'creative', selected: true },
    { id: 'narrative', title: 'Análisis Narrativo', description: 'Scores y potencial del proyecto', icon: <BarChart3 className="h-4 w-4" />, category: 'creative', selected: false },
    // Production
    { id: 'memoria', title: 'Memoria de Producción', description: 'Intenciones y visión del proyecto', icon: <FileText className="h-4 w-4" />, category: 'production', selected: true },
    { id: 'desglose_personajes', title: 'Desglose de Personajes', description: 'Categorías, días y costes', icon: <Users className="h-4 w-4" />, category: 'production', selected: true },
    { id: 'desglose_localizaciones', title: 'Desglose de Localizaciones', description: 'Análisis de necesidades de producción', icon: <MapPin className="h-4 w-4" />, category: 'production', selected: true },
    { id: 'presupuesto', title: 'Presupuesto ICAA', description: 'Resumen por capítulos', icon: <FileSpreadsheet className="h-4 w-4" />, category: 'production', selected: true },
    // Financing
    { id: 'plan_financiero', title: 'Plan de Financiación', description: 'Fuentes de financiación', icon: <Calculator className="h-4 w-4" />, category: 'financing', selected: true },
  ]);

  const isLoading = projectLoading || linesLoading;
  const projectTitle = project?.title || 'Proyecto';

  // Track which sections actually have data to show "Sin datos" badges
  const sectionHasData: Record<string, boolean> = {
    overview: !!(project?.logline || project?.creative_analysis?.synopsis),
    characters: (project?.characters?.length ?? 0) > 0,
    locations: (project?.locations?.length ?? 0) > 0,
    narrative: !!project?.creative_analysis,
    memoria: !!project?.production_notes,
    desglose_personajes: (project?.characters?.filter((c) => c.shooting_days || c.daily_rate)?.length ?? 0) > 0,
    desglose_localizaciones: (project?.locations?.length ?? 0) > 0,
    presupuesto: budgetLines.length > 0,
    plan_financiero: (project?.financing_sources?.length ?? 0) > 0,
  };

  const toggleSection = (sectionId: string) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, selected: !s.selected } : s)));
  };

  const selectAll = (category: 'creative' | 'production' | 'financing') => {
    setSections((prev) => prev.map((s) => (s.category === category ? { ...s, selected: true } : s)));
  };

  const deselectAll = (category: 'creative' | 'production' | 'financing') => {
    setSections((prev) => prev.map((s) => (s.category === category ? { ...s, selected: false } : s)));
  };

  const selectedCount = sections.filter((s) => s.selected).length;
  const selectedByCategory = {
    creative: sections.filter((s) => s.category === 'creative' && s.selected).length,
    production: sections.filter((s) => s.category === 'production' && s.selected).length,
    financing: sections.filter((s) => s.category === 'financing' && s.selected).length,
  };

  const handleExport = () => {
    if (selectedCount === 0) {
      toast({ title: 'Selecciona secciones', description: 'Debes seleccionar al menos una sección.', variant: 'destructive' });
      return;
    }

    setIsExporting(true);

    const selectedIds = sections.filter((s) => s.selected).map((s) => s.id);
    const html = generateDossierHTML(project, budgetLines, selectedIds);

    // Open in new window for print-to-PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      toast({ title: 'Dossier generado', description: `Usa "Imprimir / Guardar PDF" en la nueva ventana para descargar como PDF.` });
    } else {
      toast({ title: 'Ventana bloqueada', description: 'Permite ventanas emergentes para generar el dossier.', variant: 'destructive' });
    }

    setIsExporting(false);
  };

  const handlePreview = () => {
    handleExport(); // Same flow — opens preview with print button
  };

  const renderSectionList = (category: 'creative' | 'production' | 'financing', title: string) => {
    const categorySections = sections.filter((s) => s.category === category);
    const allSelected = categorySections.every((s) => s.selected);
    const noneSelected = categorySections.every((s) => !s.selected);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => selectAll(category)} disabled={allSelected}>
              Seleccionar todo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deselectAll(category)} disabled={noneSelected}>
              Deseleccionar
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          {categorySections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                section.selected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <Checkbox id={section.id} checked={section.selected} onCheckedChange={() => toggleSection(section.id)} />
              <div className="p-1.5 bg-muted rounded text-muted-foreground">{section.icon}</div>
              <div className="flex-1">
                <Label htmlFor={section.id} className="font-medium cursor-pointer">
                  {section.title}
                </Label>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              {!sectionHasData[section.id] && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/30 shrink-0">Sin datos</Badge>
              )}
              {section.selected && sectionHasData[section.id] && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProductionLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exportar Dossier</h1>
            <p className="text-muted-foreground">
              Genera un documento profesional con datos reales del proyecto para convocatorias y presentaciones
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {selectedCount} secciones
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Cargando datos del proyecto...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Section Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selecciona las secciones</CardTitle>
                  <CardDescription>Elige qué contenido incluir en el dossier. Los datos proceden directamente de tu proyecto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="creative" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="creative" className="flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Creativa
                        {selectedByCategory.creative > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedByCategory.creative}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="production" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Producción
                        {selectedByCategory.production > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedByCategory.production}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="financing" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Financiación
                        {selectedByCategory.financing > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedByCategory.financing}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="creative">{renderSectionList('creative', 'Secciones Creativas')}</TabsContent>
                    <TabsContent value="production">{renderSectionList('production', 'Secciones de Producción')}</TabsContent>
                    <TabsContent value="financing">{renderSectionList('financing', 'Secciones de Financiación')}</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Export Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formato de exportación</CardTitle>
                  <CardDescription>El dossier se genera como documento HTML profesional listo para imprimir como PDF</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">PDF (via impresión)</div>
                      <div className="text-sm text-muted-foreground">Se abre vista previa → Guardar como PDF</div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secciones creativas</span>
                      <span className="font-medium">{selectedByCategory.creative}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secciones producción</span>
                      <span className="font-medium">{selectedByCategory.production}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Secciones financiación</span>
                      <span className="font-medium">{selectedByCategory.financing}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total secciones</span>
                      <span>{selectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Datos reales</span>
                      <span className="font-medium text-green-600">
                        {(project?.characters?.length ?? 0) + (project?.locations?.length ?? 0) + budgetLines.length} registros
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="lg" onClick={handleExport} disabled={isExporting || selectedCount === 0}>
                      {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                      {isExporting ? 'Generando...' : 'Generar Dossier PDF'}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handlePreview} disabled={selectedCount === 0}>
                      <Eye className="h-4 w-4 mr-2" />
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preset Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plantillas rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSections((prev) =>
                        prev.map((s) => ({
                          ...s,
                          selected: ['overview', 'characters', 'memoria', 'presupuesto', 'plan_financiero'].includes(s.id),
                        })),
                      );
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Dossier ICAA
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSections((prev) =>
                        prev.map((s) => ({
                          ...s,
                          selected: ['overview', 'narrative', 'memoria'].includes(s.id),
                        })),
                      );
                    }}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Pitch Deck
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSections((prev) =>
                        prev.map((s) => ({
                          ...s,
                          selected: s.category === 'production',
                        })),
                      );
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Pack Producción
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProductionLayout>
  );
}
