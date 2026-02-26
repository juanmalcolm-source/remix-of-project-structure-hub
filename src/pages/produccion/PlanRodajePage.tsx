import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Wand2,
  Trash2,
  RefreshCw,
  Download,
  AlertCircle,
  Plus,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { useShootingPlan } from '@/hooks/useShootingPlan';
import { Skeleton } from '@/components/ui/skeleton';
import { ShootingDayCard } from '@/components/features/ShootingDayCard';
import { ShootingPlanGenerator } from '@/components/features/ShootingPlanGenerator';
import { ShootingPlanStats } from '@/components/features/ShootingPlanStats';
import { UnassignedScenesPanel } from '@/components/features/UnassignedScenesPanel';
import { AddShootingDayDialog } from '@/components/features/AddShootingDayDialog';
import { DragDropProvider } from '@/contexts/DragDropContext';
import { calculatePlanStats, PlanGenerationOptions, SceneForPlanning, calculateEffectiveEighths, parseTimeOfDay } from '@/services/shootingPlanService';
import { cn } from '@/lib/utils';

export default function PlanRodajePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const [activeTab, setActiveTab] = useState('plan');
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<number | null>(null);
  const [confirmClearPlan, setConfirmClearPlan] = useState(false);

  const {
    sequences,
    locations,
    shootingDays,
    unassignedScenes,
    isLoading: planLoading,
    generatePlan,
    isGenerating,
    deleteDay,
    addDay,
    moveScene,
    addSceneToDay,
    removeSceneFromDay,
    updateDay,
    swapDays,
    clearPlan,
  } = useShootingPlan(projectId || '');

  // Check if we have zone data for locations
  const hasZoneData = locations.some((loc) => loc.zone);

  const isLoading = projectLoading || planLoading;
  
  const stats = calculatePlanStats(shootingDays);
  const hasSequences = sequences.length > 0;
  const hasPlan = shootingDays.length > 0;

  const handleGeneratePlan = (options: PlanGenerationOptions) => {
    generatePlan(options);
  };

  const handleDeleteDay = (dayNumber: number) => {
    setConfirmDeleteDay(dayNumber);
  };

  const handleClearPlan = () => {
    setConfirmClearPlan(true);
  };

  const handleAddDay = (dayData: { location: string; locationId?: string; timeOfDay: string; notes?: string }) => {
    addDay(dayData);
  };

  const handleAssignSceneToDay = (sequenceId: string, dayNumber: number) => {
    addSceneToDay({ sequenceId, dayNumber });
  };

  const handleCreateDayWithScene = (sequenceId: string) => {
    const sequence = sequences.find(s => s.id === sequenceId);
    if (!sequence) return;
    
    const pageEighths = sequence.page_eighths || 1;
    const complexity = sequence.scene_complexity || 'media';
    
    const scene: SceneForPlanning = {
      id: sequence.id,
      sequence_number: sequence.sequence_number,
      title: sequence.title || `Escena ${sequence.sequence_number}`,
      description: sequence.description || '',
      location_name: sequence.title?.replace(/^(INT\.|EXT\.|INT\/EXT\.)\s*/i, '').replace(/\s*[-—].*$/i, '') || 'Nueva localización',
      location_id: null,
      time_of_day: sequence.time_of_day || parseTimeOfDay(sequence.title || ''),
      page_eighths: pageEighths,
      scene_complexity: complexity,
      characters: Array.isArray(sequence.characters_in_scene) 
        ? (sequence.characters_in_scene as string[]) 
        : [],
      effectiveEighths: calculateEffectiveEighths(pageEighths, complexity),
    };
    
    addDay({
      location: scene.location_name,
      timeOfDay: scene.time_of_day,
      scenes: [scene],
    });
  };

  const handleMoveSceneBetweenDays = (sceneId: string, fromDayNumber: number, toDayNumber: number) => {
    moveScene({ sceneId, fromDayNumber, toDayNumber });
  };

  const handleRemoveSceneFromDay = (sceneId: string, dayNumber: number) => {
    removeSceneFromDay({ sceneId, dayNumber });
  };

  const handleSwapDays = (dayNumber: number, direction: 'up' | 'down') => {
    const targetDayNumber = direction === 'up' ? dayNumber - 1 : dayNumber + 1;
    swapDays({ dayNumber1: dayNumber, dayNumber2: targetDayNumber });
  };

  // Handle drop from drag and drop
  const handleSceneDrop = (dayNumber: number, sceneId: string, fromDayNumber?: number) => {
    if (fromDayNumber === undefined) {
      // Scene from unassigned panel
      addSceneToDay({ sequenceId: sceneId, dayNumber });
    } else if (fromDayNumber !== dayNumber) {
      // Scene from another day
      moveScene({ sceneId, fromDayNumber, toDayNumber: dayNumber });
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
      <DragDropProvider>
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
            
            <div className="flex items-center gap-2">
              {hasPlan && (
                <>
                  <Button variant="outline" onClick={handleClearPlan}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Borrar plan
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowUnassigned(!showUnassigned)}
                className={cn(!showUnassigned && "text-muted-foreground")}
              >
                {showUnassigned ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </Button>
            </div>
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
          <div className={cn(
            "grid gap-6",
            showUnassigned && hasPlan ? "lg:grid-cols-[1fr,320px]" : ""
          )}>
            <div>
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
                    hasZoneData={hasZoneData}
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
                        <div className="flex items-center gap-2">
                          <AddShootingDayDialog
                            locations={locations}
                            existingDaysCount={shootingDays.length}
                            onAddDay={handleAddDay}
                            trigger={
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Añadir Jornada
                              </Button>
                            }
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setActiveTab('generator')}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerar plan
                          </Button>
                        </div>
                      </div>

                      {shootingDays.map((day, index) => (
                        <ShootingDayCard
                          key={day.dayNumber}
                          day={day}
                          allDays={shootingDays}
                          maxEighthsPerDay={32}
                          onDelete={() => handleDeleteDay(day.dayNumber)}
                          onMoveUp={() => handleSwapDays(day.dayNumber, 'up')}
                          onMoveDown={() => handleSwapDays(day.dayNumber, 'down')}
                          onSceneRemove={(sceneId) => handleRemoveSceneFromDay(sceneId, day.dayNumber)}
                          onSceneMove={(sceneId, toDayNumber) => handleMoveSceneBetweenDays(sceneId, day.dayNumber, toDayNumber)}
                          onUpdateDay={(updates) => updateDay({ dayNumber: day.dayNumber, updates })}
                          onSceneDrop={(sceneId, fromDayNumber) => handleSceneDrop(day.dayNumber, sceneId, fromDayNumber)}
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
                          <div className="flex justify-center gap-3">
                            <AddShootingDayDialog
                              locations={locations}
                              existingDaysCount={0}
                              onAddDay={handleAddDay}
                              trigger={
                                <Button variant="outline">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Añadir Jornada Manual
                                </Button>
                              }
                            />
                            <Button onClick={() => setActiveTab('generator')}>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Generar Automáticamente
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Unassigned Scenes Panel */}
            {showUnassigned && hasPlan && (
              <div className="hidden lg:block">
                <UnassignedScenesPanel
                  sequences={sequences}
                  shootingDays={shootingDays}
                  locations={locations}
                  onAssignToDay={handleAssignSceneToDay}
                  onCreateDayWithScene={handleCreateDayWithScene}
                />
              </div>
            )}
          </div>

          {/* Info card - Ley de los Octavos */}
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                📐 La "Ley de los Octavos" - Regla de Oro de Producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sistema profesional de los Asistentes de Dirección (1er AD) para medir escenas y planificar rodajes.
                Cada página de guión (Courier 12) se divide en 8 partes iguales llamadas "octavos".
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-1">📄 1 página = 8 octavos</p>
                  <p>El mínimo por escena siempre es 1/8. Una página ≈ 1 minuto en pantalla.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">📅 3-5 páginas/día (24-40 oct)</p>
                  <p>Ritmo estándar profesional. Para indie/cortos: 3-4 páginas (24-32 oct).</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">⚙️ Ajuste por complejidad</p>
                  <p>Acción/stunts = ×1.5 tiempo. Diálogos simples se ruedan más rápido.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Day Confirmation */}
        <AlertDialog open={confirmDeleteDay !== null} onOpenChange={() => setConfirmDeleteDay(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar día {confirmDeleteDay}?</AlertDialogTitle>
              <AlertDialogDescription>
                Las escenas asignadas volverán al panel de escenas sin asignar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (confirmDeleteDay !== null) { deleteDay(confirmDeleteDay); setConfirmDeleteDay(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Plan Confirmation */}
        <AlertDialog open={confirmClearPlan} onOpenChange={setConfirmClearPlan}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar todo el plan de rodaje?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Todos los días y asignaciones serán eliminados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { clearPlan(); setConfirmClearPlan(false); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DragDropProvider>
    </ProductionLayout>
  );
}
