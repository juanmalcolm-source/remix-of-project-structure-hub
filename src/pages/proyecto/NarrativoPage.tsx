import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Edit2, 
  Plus,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import CreativeLayout from '@/components/layout/CreativeLayout';
import type { AnalisisGuion } from '@/types/analisisGuion';

interface Act {
  id: number;
  name: string;
  pages: string;
  description: string;
  turningPoint: string;
}

export default function NarrativoPage() {
  const location = useLocation();
  const { toast } = useToast();
  const analisis = location.state?.analisis as AnalisisGuion | undefined;

  const [acts, setActs] = useState<Act[]>([
    { id: 1, name: 'Acto I - Planteamiento', pages: '1-25', description: 'Presentación del mundo y el protagonista', turningPoint: 'Detonante' },
    { id: 2, name: 'Acto II - Confrontación', pages: '26-75', description: 'El protagonista enfrenta obstáculos', turningPoint: 'Punto medio' },
    { id: 3, name: 'Acto III - Resolución', pages: '76-95', description: 'Clímax y resolución del conflicto', turningPoint: 'Clímax' },
  ]);

  const [editingAct, setEditingAct] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Emotional curve data points (simplified visualization)
  const emotionalCurve = [
    { x: 0, y: 30, label: 'Inicio' },
    { x: 20, y: 40, label: 'Detonante' },
    { x: 40, y: 60, label: 'Punto medio' },
    { x: 60, y: 45, label: 'Crisis' },
    { x: 80, y: 90, label: 'Clímax' },
    { x: 100, y: 50, label: 'Resolución' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast({ title: '✓ Guardado', duration: 1000 });
    }, 500);
  };

  const updateAct = (id: number, field: keyof Act, value: string) => {
    setActs(prev => prev.map(act => 
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  const projectTitle = analisis?.informacion_general.titulo || 'Mi Proyecto';

  return (
    <CreativeLayout 
      projectTitle={projectTitle}
      lastSaved={lastSaved}
      isSaving={isSaving}
    >
      <div className="space-y-6">
        {/* Estructura de 3 Actos */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Estructura de 3 Actos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {acts.map((act) => (
                <div 
                  key={act.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {act.pages}
                      </Badge>
                      {editingAct === act.id ? (
                        <Input
                          value={act.name}
                          onChange={(e) => updateAct(act.id, 'name', e.target.value)}
                          onBlur={() => { setEditingAct(null); handleSave(); }}
                          className="font-semibold"
                          autoFocus
                        />
                      ) : (
                        <h3 
                          className="font-semibold cursor-pointer hover:text-primary"
                          onClick={() => setEditingAct(act.id)}
                        >
                          {act.name}
                          <Edit2 className="w-3 h-3 inline ml-2 opacity-50" />
                        </h3>
                      )}
                    </div>
                    <Badge>{act.turningPoint}</Badge>
                  </div>
                  
                  {editingAct === act.id ? (
                    <Textarea
                      value={act.description}
                      onChange={(e) => updateAct(act.id, 'description', e.target.value)}
                      onBlur={() => { setEditingAct(null); handleSave(); }}
                      rows={2}
                    />
                  ) : (
                    <p 
                      className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => setEditingAct(act.id)}
                    >
                      {act.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mapa de Sensaciones (Emotional Curve) */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Mapa de Sensaciones
              <Badge variant="secondary" className="ml-2">Curva Emocional</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Simple SVG curve visualization */}
            <div className="relative h-64 bg-muted/30 rounded-lg p-4">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="25" y1="0" x2="25" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                <line x1="75" y1="0" x2="75" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                
                {/* Curve path */}
                <path
                  d={`M ${emotionalCurve.map(p => `${p.x},${100 - p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  className="drop-shadow-md"
                />
                
                {/* Data points */}
                {emotionalCurve.map((point, i) => (
                  <g key={i}>
                    <circle
                      cx={point.x}
                      cy={100 - point.y}
                      r="3"
                      fill="hsl(var(--primary))"
                      className="cursor-pointer hover:r-4 transition-all"
                    />
                  </g>
                ))}
              </svg>

              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-4">
                {emotionalCurve.map((point, i) => (
                  <span key={i}>{point.label}</span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Haz clic en los puntos para editar la intensidad emocional
              </p>
              <Button variant="outline" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerar con IA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Puntos de Giro */}
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Puntos de Giro Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <Badge className="mb-2">Pág. 10-12</Badge>
                <h4 className="font-semibold">Detonante</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  El evento que lanza la historia
                </p>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <Badge className="mb-2">Pág. 45-50</Badge>
                <h4 className="font-semibold">Punto Medio</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Cambio de dirección o revelación
                </p>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <Badge className="mb-2">Pág. 80-85</Badge>
                <h4 className="font-semibold">Clímax</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Momento de máxima tensión
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Añadir punto de giro
            </Button>
          </CardContent>
        </Card>
      </div>
    </CreativeLayout>
  );
}
