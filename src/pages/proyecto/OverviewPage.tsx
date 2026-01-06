import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Plus, 
  Edit2,
  FileText,
  Users,
  MapPin,
  Film,
  TrendingUp,
  Clock,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

export default function OverviewPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [logline, setLogline] = useState('Un protagonista debe superar obstáculos para lograr su objetivo');
  const [sinopsis, setSinopsis] = useState('Escribe aquí la sinopsis de tu proyecto...');
  const [coreEmocional, setCoreEmocional] = useState('¿De qué trata realmente tu historia?');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({ title: 'Sinopsis regenerada con IA' });
    setIsRegenerating(false);
  };

  // Calculate producibility score
  const producibilityScore = analisis 
    ? Math.max(0, Math.min(100, 
        100 
        - (analisis.localizaciones.length > 20 ? 20 : analisis.localizaciones.length > 10 ? 10 : 0)
        - (analisis.personajes.length > 30 ? 15 : analisis.personajes.length > 15 ? 7 : 0)
        - (analisis.resumen_produccion.complejidad_general === 'Alta' ? 30 : 
           analisis.resumen_produccion.complejidad_general === 'Media' ? 15 : 0)
      ))
    : 65;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEstimatedBudget = (score: number) => {
    if (score >= 80) return '€50K - €200K';
    if (score >= 60) return '€200K - €500K';
    if (score >= 40) return '€500K - €1M';
    return '€1M+';
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <CreativeLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Sinopsis */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sinopsis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Logline */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Logline (1 frase gancho)
              </label>
              {editingField === 'logline' ? (
                <Input
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  onBlur={() => { setEditingField(null); handleSave(); }}
                  autoFocus
                />
              ) : (
                <p
                  className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative"
                  onClick={() => setEditingField('logline')}
                >
                  {logline}
                  <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100" />
                </p>
              )}
            </div>

            {/* Sinopsis */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Sinopsis corta
              </label>
              {editingField === 'sinopsis' ? (
                <Textarea
                  value={sinopsis}
                  onChange={(e) => setSinopsis(e.target.value)}
                  onBlur={() => { setEditingField(null); handleSave(); }}
                  autoFocus
                  rows={4}
                />
              ) : (
                <p
                  className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative text-sm"
                  onClick={() => setEditingField('sinopsis')}
                >
                  {sinopsis}
                  <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100" />
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isRegenerating ? 'Generando...' : 'Regenerar con IA'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Datos Clave */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Datos Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Film className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Género</p>
                  <p className="font-semibold">{analisis?.informacion_general.genero || 'Drama'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Duración</p>
                  <p className="font-semibold">{analisis?.informacion_general.duracion_estimada_minutos || 90} min</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Páginas</p>
                  <p className="font-semibold">{analisis?.informacion_general.paginas_totales || 95}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Personajes</p>
                  <p className="font-semibold">{analisis?.personajes.length || 12}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Localizaciones</p>
                  <p className="font-semibold">{analisis?.localizaciones.length || 8}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Días Rodaje</p>
                  <p className="font-semibold">{analisis?.resumen_produccion.dias_rodaje.estimacion_recomendada || 20}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Core Emocional */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Core Emocional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                De qué va realmente
              </label>
              {editingField === 'core' ? (
                <Textarea
                  value={coreEmocional}
                  onChange={(e) => setCoreEmocional(e.target.value)}
                  onBlur={() => { setEditingField(null); handleSave(); }}
                  autoFocus
                  rows={3}
                />
              ) : (
                <p
                  className="p-2 rounded hover:bg-muted/50 cursor-pointer group relative text-sm"
                  onClick={() => setEditingField('core')}
                >
                  {coreEmocional}
                  <Edit2 className="w-3 h-3 absolute right-2 top-2 opacity-0 group-hover:opacity-100" />
                </p>
              )}
            </div>

            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Añadir conflicto
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Producibility Score */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Producibility Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(producibilityScore)}`}>
                {producibilityScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">de 100</p>
            </div>

            <Progress value={producibilityScore} className="h-3" />

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Presupuesto estimado</span>
              </div>
              <span className="font-semibold">{getEstimatedBudget(producibilityScore)}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>El score se calcula basándose en:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Número de localizaciones</li>
                <li>Cantidad de personajes</li>
                <li>Complejidad general de producción</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreativeLayout>
  );
}
