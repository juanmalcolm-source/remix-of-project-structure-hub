import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Wand2, 
  Loader2, 
  Info, 
  ChevronRight, 
  ChevronLeft,
  Film,
  Clock,
  Moon,
  MapPin,
  Users,
  Zap,
  Calendar
} from "lucide-react";
import { PlanGenerationOptions } from "@/services/shootingPlanService";
import { cn } from "@/lib/utils";

interface ShootingPlanGeneratorProps {
  onGenerate: (options: PlanGenerationOptions) => void;
  isGenerating: boolean;
  totalScenes: number;
  totalLocations: number;
  totalPages?: number;
}

type ProductionType = 'cortometraje' | 'largometraje' | 'serie' | 'bajo_presupuesto';

interface ProductionPreset {
  label: string;
  description: string;
  pagesPerDay: number;
  icon: React.ReactNode;
}

const productionPresets: Record<ProductionType, ProductionPreset> = {
  cortometraje: {
    label: 'Cortometraje',
    description: 'Ritmo rápido, 10-12 páginas/día',
    pagesPerDay: 11,
    icon: <Film className="h-5 w-5" />,
  },
  largometraje: {
    label: 'Largometraje',
    description: 'Estándar, 6-8 páginas/día',
    pagesPerDay: 7,
    icon: <Calendar className="h-5 w-5" />,
  },
  serie: {
    label: 'Serie TV',
    description: 'Intensivo, 8-10 páginas/día',
    pagesPerDay: 9,
    icon: <Clock className="h-5 w-5" />,
  },
  bajo_presupuesto: {
    label: 'Bajo Presupuesto',
    description: 'Muy rápido, 12-15 páginas/día',
    pagesPerDay: 13,
    icon: <Zap className="h-5 w-5" />,
  },
};

export function ShootingPlanGenerator({
  onGenerate,
  isGenerating,
  totalScenes,
  totalLocations,
  totalPages = 0,
}: ShootingPlanGeneratorProps) {
  const [step, setStep] = useState(1);
  const [productionType, setProductionType] = useState<ProductionType>('largometraje');
  const [hoursPerDay, setHoursPerDay] = useState(10);
  const [hasNightScenes, setHasNightScenes] = useState(true);
  const [prioritizeBy, setPrioritizeBy] = useState<'location' | 'time_of_day' | 'proximity'>('location');
  const [customPagesPerDay, setCustomPagesPerDay] = useState<number | null>(null);
  
  const pagesPerDay = customPagesPerDay || productionPresets[productionType].pagesPerDay;
  const maxEighthsPerDay = pagesPerDay; // 1 page = 8 eighths, so pagesPerDay * 8 / 8 = pagesPerDay

  // Calculate estimated days
  const estimatedDays = useMemo(() => {
    if (totalScenes === 0) return 0;
    // Rough estimation: totalScenes * avg eighths per scene / eighths per day
    const avgEighthsPerScene = 2; // Assume 2/8 average
    const totalEighths = totalScenes * avgEighthsPerScene;
    return Math.ceil(totalEighths / maxEighthsPerDay);
  }, [totalScenes, maxEighthsPerDay]);

  const handleGenerate = () => {
    const options: PlanGenerationOptions = {
      groupBy: prioritizeBy,
      maxEighthsPerDay: maxEighthsPerDay,
      separateDayNight: hasNightScenes,
      optimizeByProximity: prioritizeBy === 'proximity',
    };
    onGenerate(options);
  };

  const totalSteps = 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Configurar Plan de Rodaje
        </CardTitle>
        <CardDescription>
          Responde a estas preguntas para generar un plan optimizado
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )} 
            />
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalScenes}</div>
            <div className="text-sm text-muted-foreground">Escenas totales</div>
          </div>
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalLocations}</div>
            <div className="text-sm text-muted-foreground">Localizaciones</div>
          </div>
        </div>

        {/* Step 1: Production Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Paso 1 de 3</Badge>
              <h3 className="font-medium">¿Qué tipo de producción es?</h3>
            </div>
            
            <RadioGroup 
              value={productionType} 
              onValueChange={(v) => setProductionType(v as ProductionType)}
              className="grid gap-3"
            >
              {Object.entries(productionPresets).map(([key, preset]) => (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    productionType === key 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={key} id={key} className="sr-only" />
                  <div className={cn(
                    "p-2 rounded-lg",
                    productionType === key ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {preset.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{preset.label}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </div>
                  <Badge variant="secondary">{preset.pagesPerDay} oct/día</Badge>
                </label>
              ))}
            </RadioGroup>

            {/* Custom pages per day */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="customPages" className="text-sm">
                  Ajustar octavos por día manualmente
                </Label>
                <span className="text-sm font-medium text-primary">
                  {pagesPerDay} octavos/día
                </span>
              </div>
              <Slider
                id="customPages"
                min={4}
                max={16}
                step={1}
                value={[pagesPerDay]}
                onValueChange={([v]) => setCustomPagesPerDay(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>4 (lento)</span>
                <span>8 (estándar)</span>
                <span>16 (muy rápido)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Shooting conditions */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Paso 2 de 3</Badge>
              <h3 className="font-medium">Condiciones de rodaje</h3>
            </div>

            {/* Hours per day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Horas de rodaje efectivo por día
                </Label>
                <span className="text-sm font-medium">{hoursPerDay}h</span>
              </div>
              <Slider
                min={6}
                max={14}
                step={1}
                value={[hoursPerDay]}
                onValueChange={([v]) => setHoursPerDay(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6h (corto)</span>
                <span>10h (estándar)</span>
                <span>14h (maratón)</span>
              </div>
            </div>

            {/* Night scenes */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-indigo-400" />
                <div>
                  <Label htmlFor="nightScenes" className="font-medium">
                    ¿Tiene escenas nocturnas reales?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Separar días de DÍA y NOCHE en el plan
                  </p>
                </div>
              </div>
              <Switch
                id="nightScenes"
                checked={hasNightScenes}
                onCheckedChange={setHasNightScenes}
              />
            </div>
          </div>
        )}

        {/* Step 3: Prioritization */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Paso 3 de 3</Badge>
              <h3 className="font-medium">¿Cómo priorizar el plan?</h3>
            </div>
            
            <RadioGroup 
              value={prioritizeBy} 
              onValueChange={(v) => setPrioritizeBy(v as 'location' | 'time_of_day' | 'proximity')}
              className="grid gap-3"
            >
              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  prioritizeBy === 'location' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="location" className="sr-only" />
                <div className={cn(
                  "p-2 rounded-lg",
                  prioritizeBy === 'location' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Por localización</div>
                  <div className="text-sm text-muted-foreground">
                    Agrupa escenas de la misma localización (menos traslados)
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  prioritizeBy === 'time_of_day' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="time_of_day" className="sr-only" />
                <div className={cn(
                  "p-2 rounded-lg",
                  prioritizeBy === 'time_of_day' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Por momento del día</div>
                  <div className="text-sm text-muted-foreground">
                    Agrupa escenas de DÍA/NOCHE/ATARDECER juntas
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  prioritizeBy === 'proximity' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="proximity" className="sr-only" />
                <div className={cn(
                  "p-2 rounded-lg",
                  prioritizeBy === 'proximity' ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Por disponibilidad de actores</div>
                  <div className="text-sm text-muted-foreground">
                    Agrupa escenas con los mismos personajes
                  </div>
                </div>
              </label>
            </RadioGroup>

            {/* Estimation */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Estimación del plan</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Con <strong>{totalScenes} escenas</strong> a un ritmo de{' '}
                    <strong>{pagesPerDay} octavos/día</strong>, necesitarás aproximadamente{' '}
                    <strong className="text-primary">{estimatedDays} días de rodaje</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || totalScenes === 0}
              className="min-w-[180px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar Plan
                </>
              )}
            </Button>
          )}
        </div>

        {totalScenes === 0 && (
          <p className="text-center text-sm text-destructive">
            No hay escenas para planificar. Analiza primero el guión.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
