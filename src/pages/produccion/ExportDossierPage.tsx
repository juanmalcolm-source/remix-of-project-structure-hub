import { useState } from 'react';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Presentation, 
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
  Settings
} from 'lucide-react';

interface DossierSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'creative' | 'production' | 'financing';
  selected: boolean;
  available: boolean;
}

export default function ExportDossierPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'pptx'>('pdf');
  const [sections, setSections] = useState<DossierSection[]>([
    // Creative
    {
      id: 'overview',
      title: 'Sinopsis y Logline',
      description: 'Resumen ejecutivo del proyecto',
      icon: <Film className="h-4 w-4" />,
      category: 'creative',
      selected: true,
      available: true,
    },
    {
      id: 'characters',
      title: 'Personajes',
      description: 'Descripción y arcos dramáticos',
      icon: <Users className="h-4 w-4" />,
      category: 'creative',
      selected: true,
      available: true,
    },
    {
      id: 'locations',
      title: 'Localizaciones',
      description: 'Espacios narrativos del guión',
      icon: <MapPin className="h-4 w-4" />,
      category: 'creative',
      selected: true,
      available: true,
    },
    {
      id: 'moodboard',
      title: 'Mood Board',
      description: 'Referencias visuales y paleta de color',
      icon: <Palette className="h-4 w-4" />,
      category: 'creative',
      selected: true,
      available: true,
    },
    {
      id: 'narrative',
      title: 'Análisis Narrativo',
      description: 'Estructura de actos y puntos de giro',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'creative',
      selected: false,
      available: true,
    },
    // Production
    {
      id: 'memoria',
      title: 'Memoria de Producción',
      description: 'Intenciones y visión del proyecto',
      icon: <FileText className="h-4 w-4" />,
      category: 'production',
      selected: true,
      available: true,
    },
    {
      id: 'desglose_personajes',
      title: 'Desglose de Personajes',
      description: 'Categorías, días y costes',
      icon: <Users className="h-4 w-4" />,
      category: 'production',
      selected: true,
      available: true,
    },
    {
      id: 'desglose_localizaciones',
      title: 'Desglose de Localizaciones',
      description: 'Análisis de necesidades de producción',
      icon: <MapPin className="h-4 w-4" />,
      category: 'production',
      selected: true,
      available: true,
    },
    {
      id: 'plan_rodaje',
      title: 'Plan de Rodaje',
      description: 'Calendario de producción',
      icon: <Settings className="h-4 w-4" />,
      category: 'production',
      selected: false,
      available: true,
    },
    {
      id: 'presupuesto',
      title: 'Presupuesto ICAA',
      description: 'Desglose por capítulos',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      category: 'production',
      selected: true,
      available: true,
    },
    // Financing
    {
      id: 'plan_financiero',
      title: 'Plan de Financiación',
      description: 'Estructura de financiación',
      icon: <Calculator className="h-4 w-4" />,
      category: 'financing',
      selected: true,
      available: true,
    },
    {
      id: 'incentivos',
      title: 'Análisis de Incentivos',
      description: 'Comparativa territorial y simulación',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'financing',
      selected: false,
      available: true,
    },
    {
      id: 'cashflow',
      title: 'Cash Flow',
      description: 'Timeline de cobros y pagos',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'financing',
      selected: false,
      available: true,
    },
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, selected: !s.selected } : s
    ));
  };

  const selectAll = (category: 'creative' | 'production' | 'financing') => {
    setSections(prev => prev.map(s => 
      s.category === category ? { ...s, selected: true } : s
    ));
  };

  const deselectAll = (category: 'creative' | 'production' | 'financing') => {
    setSections(prev => prev.map(s => 
      s.category === category ? { ...s, selected: false } : s
    ));
  };

  const selectedCount = sections.filter(s => s.selected).length;
  const selectedByCategory = {
    creative: sections.filter(s => s.category === 'creative' && s.selected).length,
    production: sections.filter(s => s.category === 'production' && s.selected).length,
    financing: sections.filter(s => s.category === 'financing' && s.selected).length,
  };

  const handleExport = async () => {
    if (selectedCount === 0) {
      toast({
        title: "Selecciona secciones",
        description: "Debes seleccionar al menos una sección para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const selectedSections = sections.filter(s => s.selected).map(s => s.title);
    
    // Create a mock file download
    const content = `DOSSIER DE PROYECTO\n\nSecciones incluidas:\n${selectedSections.map(s => `- ${s}`).join('\n')}\n\nFormato: ${exportFormat.toUpperCase()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-proyecto.${exportFormat === 'pdf' ? 'txt' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    toast({
      title: "Dossier exportado",
      description: `Se ha generado el dossier en formato ${exportFormat.toUpperCase()} con ${selectedCount} secciones.`,
    });
  };

  const renderSectionList = (category: 'creative' | 'production' | 'financing', title: string) => {
    const categorySections = sections.filter(s => s.category === category);
    const allSelected = categorySections.every(s => s.selected);
    const noneSelected = categorySections.every(s => !s.selected);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => selectAll(category)}
              disabled={allSelected}
            >
              Seleccionar todo
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => deselectAll(category)}
              disabled={noneSelected}
            >
              Deseleccionar
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          {categorySections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                section.selected 
                  ? 'bg-primary/5 border-primary/30' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <Checkbox
                id={section.id}
                checked={section.selected}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <div className="p-1.5 bg-muted rounded text-muted-foreground">
                {section.icon}
              </div>
              <div className="flex-1">
                <Label 
                  htmlFor={section.id} 
                  className="font-medium cursor-pointer"
                >
                  {section.title}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              {section.selected && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ProductionLayout projectTitle="Proyecto Demo" lastSaved={new Date()}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exportar Dossier</h1>
            <p className="text-muted-foreground">
              Genera un documento profesional con las secciones que necesites
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {selectedCount} secciones seleccionadas
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Selecciona las secciones</CardTitle>
                <CardDescription>
                  Elige qué contenido incluir en el dossier
                </CardDescription>
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

                  <TabsContent value="creative">
                    {renderSectionList('creative', 'Secciones Creativas')}
                  </TabsContent>
                  <TabsContent value="production">
                    {renderSectionList('production', 'Secciones de Producción')}
                  </TabsContent>
                  <TabsContent value="financing">
                    {renderSectionList('financing', 'Secciones de Financiación')}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formato de exportación</CardTitle>
                <CardDescription>
                  Elige el formato del documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    exportFormat === 'pdf' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setExportFormat('pdf')}
                >
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">PDF</div>
                    <div className="text-sm text-muted-foreground">
                      Ideal para enviar por email
                    </div>
                  </div>
                  {exportFormat === 'pdf' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    exportFormat === 'pptx' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setExportFormat('pptx')}
                >
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Presentation className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">PowerPoint</div>
                    <div className="text-sm text-muted-foreground">
                      Perfecto para presentaciones
                    </div>
                  </div>
                  {exportFormat === 'pptx' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
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
                    <span className="text-muted-foreground">Formato</span>
                    <span className="font-medium">{exportFormat.toUpperCase()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleExport}
                    disabled={isExporting || selectedCount === 0}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isExporting ? 'Generando...' : 'Exportar Dossier'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={selectedCount === 0}
                  >
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
                    setSections(prev => prev.map(s => ({
                      ...s,
                      selected: ['overview', 'characters', 'moodboard', 'memoria', 'plan_financiero'].includes(s.id)
                    })));
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Dossier ICAA
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSections(prev => prev.map(s => ({
                      ...s,
                      selected: ['overview', 'moodboard', 'memoria'].includes(s.id)
                    })));
                  }}
                >
                  <Presentation className="h-4 w-4 mr-2" />
                  Pitch Deck
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSections(prev => prev.map(s => ({
                      ...s,
                      selected: s.category === 'production'
                    })));
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Pack Producción
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProductionLayout>
  );
}
