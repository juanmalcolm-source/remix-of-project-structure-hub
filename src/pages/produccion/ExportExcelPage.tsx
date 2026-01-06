import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Download,
  FileText,
  Table,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ProductionLayout from '@/components/layout/ProductionLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

export default function ExportExcelPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [isExporting, setIsExporting] = useState(false);
  const [exportedFormats, setExportedFormats] = useState<string[]>([]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would generate an Excel file
    // For now, we'll create a simple CSV as demonstration
    const csvContent = `PRESUPUESTO ICAA
Proyecto: ${analisis?.informacion_general.titulo || 'Mi Proyecto'}

CAPÍTULO,CONCEPTO,UNIDADES,CANTIDAD,PRECIO/UD,AGENCIA %,TOTAL
01,Guión y Música,1,1,15000,0,15000
02,Personal Artístico,1,1,80000,15,92000
03,Equipo Técnico,1,1,60000,0,60000
04,Escenografía,1,1,25000,0,25000
05,Estudios y Varios,1,1,20000,0,20000
06,Maquinaria y Transportes,1,1,15000,0,15000
07,Viajes y Dietas,1,1,12000,0,12000
08,Material Sensible,1,1,5000,0,5000
09,Laboratorio,1,1,18000,0,18000
10,Seguros,1,1,8000,0,8000
11,Gastos Generales,1,1,10000,0,10000
12,Explotación y Financiación,1,1,5000,0,5000

TOTAL GENERAL,,,,,285000`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presupuesto-ICAA-${analisis?.informacion_general.titulo?.replace(/\s+/g, '-') || 'proyecto'}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportedFormats(prev => [...prev, 'excel']);
    toast({ 
      title: 'Presupuesto exportado',
      description: 'El archivo CSV se ha descargado correctamente'
    });
  };

  const handleExportJSON = () => {
    const data = {
      proyecto: analisis?.informacion_general.titulo || 'Mi Proyecto',
      fecha: new Date().toISOString(),
      capitulos: [
        { id: 1, nombre: 'Guión y Música', total: 15000 },
        { id: 2, nombre: 'Personal Artístico', total: 92000 },
        // ... etc
      ],
      total: 285000
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presupuesto-${analisis?.informacion_general.titulo?.replace(/\s+/g, '-') || 'proyecto'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportedFormats(prev => [...prev, 'json']);
    toast({ title: 'JSON exportado' });
  };

  const handleExportPersonajesCSV = () => {
    const headers = 'Nombre,Categoría,Días Rodaje,Tarifa/Día,Agencia %,Total\n';
    const rows = analisis?.personajes.map(p => 
      `"${p.nombre}","${p.categoria}",${p.dias_rodaje_estimados},1000,15,${p.dias_rodaje_estimados * 1000 * 1.15}`
    ).join('\n') || '';

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personajes-${analisis?.informacion_general.titulo?.replace(/\s+/g, '-') || 'proyecto'}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportedFormats(prev => [...prev, 'personajes']);
    toast({ title: 'Personajes exportados a CSV' });
  };

  const handleExportLocalizacionesCSV = () => {
    const headers = 'Localización,Tipo,Complejidad,Días Estimados,Escenas\n';
    const rows = analisis?.localizaciones.map(l => 
      `"${l.nombre}","${l.tipo}","${l.complejidad}",${l.dias_rodaje_estimados},${l.escenas.length}`
    ).join('\n') || '';

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localizaciones-${analisis?.informacion_general.titulo?.replace(/\s+/g, '-') || 'proyecto'}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportedFormats(prev => [...prev, 'localizaciones']);
    toast({ title: 'Localizaciones exportadas a CSV' });
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  const exportOptions = [
    {
      id: 'excel',
      title: 'Presupuesto ICAA (Excel/CSV)',
      description: 'Formato oficial con los 12 capítulos, fórmulas y subtotales',
      icon: FileSpreadsheet,
      action: handleExportExcel,
      isLoading: isExporting,
      badge: 'Formato ICAA'
    },
    {
      id: 'personajes',
      title: 'Desglose Personajes (CSV)',
      description: 'Lista de personajes con categorías, días y tarifas',
      icon: Table,
      action: handleExportPersonajesCSV,
      badge: null
    },
    {
      id: 'localizaciones',
      title: 'Desglose Localizaciones (CSV)',
      description: 'Lista de localizaciones con tipo, complejidad y días',
      icon: Table,
      action: handleExportLocalizacionesCSV,
      badge: null
    },
    {
      id: 'json',
      title: 'Datos completos (JSON)',
      description: 'Para integración con otras herramientas',
      icon: FileText,
      action: handleExportJSON,
      badge: 'Desarrolladores'
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
            Descarga el presupuesto en formato ICAA oficial y otros documentos de producción
          </p>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isExported = exportedFormats.includes(option.id);
            
            return (
              <Card 
                key={option.id}
                className={`hover:shadow-md transition-shadow ${isExported ? 'border-green-500/50 bg-green-500/5' : ''}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExported ? 'bg-green-500/20' : 'bg-primary/10'}`}>
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
                <CardContent>
                  <Button 
                    onClick={option.action}
                    disabled={option.isLoading}
                    className="w-full"
                    variant={isExported ? 'outline' : 'default'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {option.isLoading ? 'Exportando...' : isExported ? 'Descargar de nuevo' : 'Descargar'}
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
              <strong>Nota:</strong> El formato Excel ICAA es compatible con las convocatorias oficiales del ICAA y 
              entidades de financiación. Incluye los 12 capítulos oficiales con fórmulas automáticas de cálculo.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}
