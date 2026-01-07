import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Wand2,
  Trash2,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { useShootingPlan } from '@/hooks/useShootingPlan';
import { Skeleton } from '@/components/ui/skeleton';
import { ShootingDayCard } from '@/components/features/ShootingDayCard';
import { ShootingPlanGenerator } from '@/components/features/ShootingPlanGenerator';
import { ShootingPlanStats } from '@/components/features/ShootingPlanStats';
import { calculatePlanStats, PlanGenerationOptions } from '@/services/shootingPlanService';

export default function PlanRodajePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const [activeTab, setActiveTab] = useState('plan');

  const {
    sequences,
    locations,
    shootingDays,
    isLoading: planLoading,
    generatePlan,
    isGenerating,
    deleteDay,
    clearPlan,
  } = useShootingPlan(projectId || '');

  const isLoading = projectLoading || planLoading;
  
  const stats = calculatePlanStats(shootingDays);
  const hasSequences = sequences.length > 0;
  const hasPlan = shootingDays.length > 0;

  const handleGeneratePlan = (options: PlanGenerationOptions) => {
    generatePlan(options);
  };

  const handleDeleteDay = (dayNumber: number) => {
    if (confirm('¿Eliminar este día del plan?')) {
      deleteDay(dayNumber);
    }
  };

  const handleClearPlan = () => {
    if (confirm('¿Eliminar todo el plan de rodaje? Esta acción no se puede deshacer.')) {
      clearPlan();
    }
  };

  if (isLoading) {
    return (
      <ProductionLayout projectTitle="Cargando...">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ProductionLayout>
    );
  }

  if (!project) {
    return (
      <ProductionLayout projectTitle="Error">
        <div className="text-center py-12 text-muted-foreground">
          No se encontró el proyecto
        </div>
      </ProductionLayout>
    );
  }

  const projectTitle = project.title || 'Mi Proyecto';

  return (
    <ProductionLayout projectTitle={projectTitle}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Plan de Rodaje
            </h1>
            <p className="text-muted-foreground">
              Planifica y organiza los días de rodaje usando la Ley de los Octavos
            </p>
          </div>
          
          {hasPlan && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClearPlan}>
                <Trash2 className="h-4 w-4 mr-2" />
                Borrar plan
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        {hasPlan && (
          <ShootingPlanStats
            totalScenes={stats.totalScenes}
            totalEighths={stats.totalEighths}
            totalDays={stats.totalDays}
            uniqueLocations={stats.uniqueLocations}
            dayDays={stats.dayDays}
            nightDays={stats.nightDays}
            totalCharacters={stats.totalCharacters}
            avgEighthsPerDay={stats.avgEighthsPerDay}
          />
        )}

        {/* No sequences warning */}
        {!hasSequences && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay escenas analizadas en este proyecto. Primero analiza el guión para poder generar un plan de rodaje inteligente.
            </AlertDescription>
          </Alert>
        )}

        {/* Main content with tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Plan de Rodaje
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generador Inteligente
            </TabsTrigger>
          </TabsList>

          {/* Generator Tab */}
          <TabsContent value="generator" className="mt-6">
            <ShootingPlanGenerator
              onGenerate={handleGeneratePlan}
              isGenerating={isGenerating}
              totalScenes={sequences.length}
              totalLocations={locations.length}
            />
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="mt-6">
            {hasPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {shootingDays.length} días de rodaje planificados
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('generator')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar plan
                  </Button>
                </div>

                {shootingDays.map((day, index) => (
                  <ShootingDayCard
                    key={day.dayNumber}
                    day={day}
                    maxEighths={8}
                    onDelete={() => handleDeleteDay(day.dayNumber)}
                    isFirst={index === 0}
                    isLast={index === shootingDays.length - 1}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay plan de rodaje</h3>
                    <p className="text-muted-foreground mb-6">
                      Genera un plan de rodaje inteligente basado en el análisis del guión
                    </p>
                    <Button onClick={() => setActiveTab('generator')}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Ir al Generador
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info card */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              ¿Cómo funciona la Ley de los Octavos?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">📄 1 página = 8 octavos</p>
                <p>Cada página de guión se divide en 8 partes. Una escena de 1/4 de página = 2 octavos.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">📅 1 día = ~8 octavos</p>
                <p>Un día de rodaje estándar permite filmar aproximadamente 8 octavos (1 página completa).</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">⚙️ Ajuste por complejidad</p>
                <p>Las escenas complejas (stunts, efectos) requieren más tiempo. Las simples permiten rodar más.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProductionLayout>
  );
}
