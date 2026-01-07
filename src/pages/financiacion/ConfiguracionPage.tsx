import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Settings, 
  Film,
  User,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import FinancingLayout from '@/components/layout/FinancingLayout';
import { useProject, useUpdateFinancingPlan } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConfiguracionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const { data: project, isLoading } = useProject(projectId);
  const updateFinancing = useUpdateFinancingPlan();

  const [projectType, setProjectType] = useState('largometraje');
  const [directorGender, setDirectorGender] = useState('');
  const [isDebut, setIsDebut] = useState(false);
  const [shootingTerritory, setShootingTerritory] = useState('');
  const [totalBudget, setTotalBudget] = useState(500000);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from project data
  useEffect(() => {
    if (project) {
      setProjectType(project.project_type || 'largometraje');
      if (project.financing_plan) {
        setDirectorGender(project.financing_plan.director_gender || '');
        setIsDebut(project.financing_plan.is_debut || false);
        setShootingTerritory(project.financing_plan.shooting_territory || '');
        setTotalBudget(project.financing_plan.total_budget || 500000);
      }
    }
  }, [project]);

  const handleSave = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      await updateFinancing.mutateAsync({
        projectId,
        data: {
          director_gender: directorGender,
          is_debut: isDebut,
          shooting_territory: shootingTerritory,
          total_budget: totalBudget,
        }
      });
      setLastSaved(new Date());
      toast({ title: '✓ Configuración guardada', duration: 1000 });
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <FinancingLayout projectTitle="Cargando...">
        <div className="max-w-3xl mx-auto space-y-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </FinancingLayout>
    );
  }

  if (!project) {
    return (
      <FinancingLayout projectTitle="Error">
        <div className="text-center py-12 text-muted-foreground">
          No se encontró el proyecto
        </div>
      </FinancingLayout>
    );
  }

  const projectTitle = project.title || 'Mi Proyecto';

  return (
    <FinancingLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <Settings className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Configuración del Proyecto</h2>
          <p className="text-muted-foreground">
            Estos datos afectan al cálculo de incentivos fiscales y ayudas
          </p>
        </div>

        {/* Tipo de proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Tipo de Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['largometraje', 'cortometraje', 'documental', 'serie'].map((type) => (
                <Button
                  key={type}
                  variant={projectType === type ? 'default' : 'outline'}
                  onClick={() => { setProjectType(type); handleSave(); }}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Director/a */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Director/a
            </CardTitle>
            <CardDescription>
              El género y experiencia del director/a puede dar acceso a bonificaciones extra
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Género del director/a</Label>
                <Select value={directorGender} onValueChange={(v) => { setDirectorGender(v); handleSave(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Mujer</SelectItem>
                    <SelectItem value="male">Hombre</SelectItem>
                    <SelectItem value="other">Otro / No binario</SelectItem>
                  </SelectContent>
                </Select>
                {directorGender === 'female' && (
                  <p className="text-sm text-green-600">✓ Puede optar a +5-10% en puntuación ICAA</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>¿Es ópera prima?</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={isDebut} onCheckedChange={(v) => { setIsDebut(v); handleSave(); }} />
                  <span className="text-sm text-muted-foreground">
                    {isDebut ? 'Sí, primer largometraje' : 'No'}
                  </span>
                </div>
                {isDebut && (
                  <p className="text-sm text-green-600">✓ +10 puntos en convocatoria selectiva</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Territorio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Territorio de Rodaje
            </CardTitle>
            <CardDescription>
              El territorio principal determina los incentivos fiscales aplicables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={shootingTerritory} onValueChange={(v) => { setShootingTerritory(v); handleSave(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar territorio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navarra">Navarra (45-50%)</SelectItem>
                <SelectItem value="bizkaia">País Vasco - Bizkaia (35-60%, sin límite)</SelectItem>
                <SelectItem value="alava-gipuzkoa">País Vasco - Álava/Gipuzkoa (50-60%)</SelectItem>
                <SelectItem value="canarias">Canarias (54% primer millón)</SelectItem>
                <SelectItem value="madrid">Madrid (30% primer millón)</SelectItem>
                <SelectItem value="otro">Otro territorio</SelectItem>
              </SelectContent>
            </Select>

            {shootingTerritory && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Información del territorio:</h4>
                {shootingTerritory === 'navarra' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Deducción: 45-50% del gasto elegible</li>
                    <li>• Límite: €5M por producción</li>
                    <li>• Bonus +5% para directoras, euskera o documentales</li>
                  </ul>
                )}
                {shootingTerritory === 'bizkaia' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Deducción: 35-60% del gasto elegible</li>
                    <li>• <strong className="text-green-600">SIN LÍMITE de deducción</strong></li>
                    <li>• Bonus +10% para proyectos en euskera</li>
                  </ul>
                )}
                {shootingTerritory === 'alava-gipuzkoa' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Deducción: 50-60% del gasto elegible</li>
                    <li>• Límite: €10M por producción</li>
                    <li>• Bonus +10% para euskera (hasta 70%)</li>
                  </ul>
                )}
                {shootingTerritory === 'canarias' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Deducción: 54% primer millón + 45% resto</li>
                    <li>• Límite: €36M por producción</li>
                    <li>• <strong className="text-green-600">IGIC 0%</strong> y ZEC al 4%</li>
                  </ul>
                )}
                {shootingTerritory === 'madrid' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Deducción: 30% primer millón + 25% resto</li>
                    <li>• Límite: €20M por producción</li>
                    <li>• Acceso a Film Madrid y otras ayudas</li>
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presupuesto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Presupuesto Total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Presupuesto estimado</Label>
              <Input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                onBlur={handleSave}
                className="text-lg font-semibold"
              />
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" size="lg">
          Guardar configuración
        </Button>
      </div>
    </FinancingLayout>
  );
}