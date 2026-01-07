import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2, Info } from "lucide-react";
import { PlanGenerationOptions } from "@/services/shootingPlanService";

interface ShootingPlanGeneratorProps {
  onGenerate: (options: PlanGenerationOptions) => void;
  isGenerating: boolean;
  totalScenes: number;
  totalLocations: number;
}

export function ShootingPlanGenerator({
  onGenerate,
  isGenerating,
  totalScenes,
  totalLocations,
}: ShootingPlanGeneratorProps) {
  const [options, setOptions] = useState<PlanGenerationOptions>({
    groupBy: 'location',
    maxEighthsPerDay: 8,
    separateDayNight: true,
    optimizeByProximity: false,
  });

  const handleGenerate = () => {
    onGenerate(options);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generador Inteligente de Plan de Rodaje
        </CardTitle>
        <CardDescription>
          Configura las opciones y genera automáticamente un plan de rodaje optimizado usando la Ley de los Octavos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">¿Qué es la Ley de los Octavos?</p>
            <p>
              Una página de guión equivale a 8 octavos. Un día de rodaje estándar permite rodar aproximadamente 
              8 octavos (1 página). Las escenas complejas requieren más tiempo, las simples menos.
            </p>
          </div>
        </div>

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

        {/* Options */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="groupBy">Agrupar escenas por</Label>
              <Select 
                value={options.groupBy} 
                onValueChange={(value: 'location' | 'time_of_day' | 'proximity') => 
                  setOptions({ ...options, groupBy: value })
                }
              >
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Localización</SelectItem>
                  <SelectItem value="time_of_day">Momento del día</SelectItem>
                  <SelectItem value="proximity">Proximidad geográfica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxEighths">Máx. octavos por día</Label>
              <Input
                id="maxEighths"
                type="number"
                min={4}
                max={16}
                value={options.maxEighthsPerDay}
                onChange={(e) => setOptions({ ...options, maxEighthsPerDay: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Estándar: 8 octavos (1 página). Ajusta según tu ritmo de producción.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="separateDayNight" className="font-medium">
                Separar DÍA / NOCHE
              </Label>
              <p className="text-sm text-muted-foreground">
                Agrupa escenas de día y noche en días de rodaje diferentes
              </p>
            </div>
            <Switch
              id="separateDayNight"
              checked={options.separateDayNight}
              onCheckedChange={(checked) => setOptions({ ...options, separateDayNight: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="optimizeProximity" className="font-medium">
                Optimizar por proximidad
              </Label>
              <p className="text-sm text-muted-foreground">
                Ordena los días para minimizar desplazamientos entre localizaciones
              </p>
            </div>
            <Switch
              id="optimizeProximity"
              checked={options.optimizeByProximity}
              onCheckedChange={(checked) => setOptions({ ...options, optimizeByProximity: checked })}
            />
          </div>
        </div>

        {/* Generate button */}
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleGenerate}
          disabled={isGenerating || totalScenes === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando plan...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generar Plan Inteligente
            </>
          )}
        </Button>

        {totalScenes === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No hay escenas para planificar. Analiza primero el guión.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
