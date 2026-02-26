import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Sparkles, ChevronDown, ChevronUp, ListChecks, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { useSolicitudDocumentos } from '@/hooks/useSolicitudDocumentos';
import { useAnalisisSolicitud } from '@/hooks/useAnalisisSolicitud';
import { useTareasSolicitud } from '@/hooks/useTareasSolicitud';
import { useProject } from '@/hooks/useProject';
import { generateWithAI, extractJson } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import ConvocatoriasLayout from '@/components/layout/ConvocatoriasLayout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import type { Tables, Json } from '@/integrations/supabase/types';

interface ResultadoAnalisis {
  puntuacion?: number;
  fortalezas?: string[];
  debilidades?: string[];
  recomendaciones?: string[];
  probabilidad_exito?: string;
}

type SolicitudWithConv = Tables<'solicitudes'> & {
  convocatorias: Tables<'convocatorias'> | null;
};

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  en_preparacion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  concedida: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  denegada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  desistida: 'bg-muted text-muted-foreground',
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  en_preparacion: 'En Preparación',
  enviada: 'Enviada',
  concedida: 'Concedida',
  denegada: 'Denegada',
  desistida: 'Desistida',
};

const DOC_ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  generando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const DOCUMENT_TYPES = [
  { tipo: 'memoria_artistica', nombre: 'Memoria Artística' },
  { tipo: 'memoria_produccion', nombre: 'Memoria de Producción' },
  { tipo: 'presupuesto', nombre: 'Presupuesto Justificativo' },
  { tipo: 'plan_financiacion', nombre: 'Plan de Financiación' },
  { tipo: 'plan_distribucion', nombre: 'Plan de Distribución' },
];

function SolicitudCard({ solicitud, onUpdateEstado, projectTitle }: { solicitud: SolicitudWithConv; onUpdateEstado: (id: string, estado: string) => void; projectTitle?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
  const { documentos, isLoading: docsLoading, createDocumento } = useSolicitudDocumentos(solicitud.id);
  const { analisis, isLoading: analisisLoading, createAnalisis } = useAnalisisSolicitud(solicitud.id);
  const { tareas, isLoading: tareasLoading } = useTareasSolicitud(solicitud.id);

  const convName = solicitud.convocatorias?.nombre || 'Convocatoria';

  const handleGenerateAnalysis = async () => {
    setAiLoading(true);
    try {
      const convInfo = solicitud.convocatorias;
      const prompt = `Analiza la compatibilidad entre este proyecto y esta convocatoria:

Proyecto: "${projectTitle || 'Sin título'}"
Convocatoria: "${convName}"
Organismo: ${convInfo?.organismo || 'No especificado'}
Ámbito: ${convInfo?.ambito || 'No especificado'}
Descripción: ${convInfo?.descripcion || 'No disponible'}
Requisitos: ${convInfo?.requisitos || 'No especificados'}
Dotación: ${convInfo?.dotacion ? convInfo.dotacion + '€' : 'No especificada'}`;

      const text = await generateWithAI({
        prompt,
        systemPrompt: 'Eres un experto en convocatorias de ayudas al cine en España y Europa. Analiza la compatibilidad entre un proyecto cinematográfico y una convocatoria. Devuelve SOLO un JSON (sin texto adicional) con: puntuacion (number 0-100), fortalezas (string[], 3-4 puntos fuertes), debilidades (string[], 2-3 áreas de mejora), recomendaciones (string[], 3-4 recomendaciones específicas), probabilidad_exito (string: "alta"|"media"|"baja").',
        maxTokens: 1500,
      });

      const result = extractJson<{
        puntuacion?: number;
        fortalezas?: string[];
        debilidades?: string[];
        recomendaciones?: string[];
        probabilidad_exito?: string;
      }>(text);

      createAnalisis({
        tipo: 'elegibilidad',
        resultado: result as unknown as Json,
      });

      toast({ title: 'IA completada', description: 'Análisis de elegibilidad generado' });
    } catch (err: unknown) {
      toast({ title: 'Error de IA', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateDoc = (tipo: string, nombre: string) => {
    createDocumento({ tipo, nombre, estado: 'pendiente' });
  };

  const lastAnalysis = analisis[0];
  const proximasTareas = tareas.slice(0, 3);

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{convName}</CardTitle>
            <Badge className={ESTADO_COLORS[solicitud.estado || 'borrador']}>
              {ESTADO_LABELS[solicitud.estado || 'borrador']}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
        {solicitud.importe_solicitado != null && (
          <p className="text-sm text-muted-foreground">
            Importe: {solicitud.importe_solicitado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Cambiar estado:</span>
            <Select value={solicitud.estado || 'borrador'} onValueChange={(v) => onUpdateEstado(solicitud.id, v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Análisis */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Análisis de Elegibilidad</h4>
            {analisisLoading ? <Skeleton className="h-16 w-full" /> : lastAnalysis ? (() => {
              const res = lastAnalysis.resultado as unknown as ResultadoAnalisis | null;
              return (
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-sm space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Puntuación:</span>
                    <span className="text-lg font-bold">{res?.puntuacion}/100</span>
                    {res?.probabilidad_exito && (
                      <Badge variant={
                        res.probabilidad_exito === 'alta' ? 'default' :
                        res.probabilidad_exito === 'media' ? 'secondary' : 'outline'
                      }>
                        Probabilidad {res.probabilidad_exito}
                      </Badge>
                    )}
                  </div>
                  <p><strong>Fortalezas:</strong> {(res?.fortalezas || []).join(', ')}</p>
                  <p><strong>Debilidades:</strong> {(res?.debilidades || []).join(', ')}</p>
                  <p><strong>Recomendaciones:</strong> {(res?.recomendaciones || []).join(', ')}</p>
                </CardContent>
              </Card>);
            })()
            : (
              <Button variant="outline" size="sm" onClick={handleGenerateAnalysis} disabled={aiLoading}>
                {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar Análisis con IA</>}
              </Button>
            )}
          </div>

          {/* Documentos */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Documentos Requeridos</h4>
            {docsLoading ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-2">
                {DOCUMENT_TYPES.map((dt) => {
                  const doc = documentos.find((d) => d.tipo === dt.tipo);
                  return (
                    <div key={dt.tipo} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{dt.nombre}</span>
                      </div>
                      {doc ? (
                        <Badge className={DOC_ESTADO_COLORS[doc.estado || 'pendiente']}>{doc.estado}</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleGenerateDoc(dt.tipo, dt.nombre)}>
                          <Sparkles className="w-3 h-3 mr-1" /> Generar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tareas */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Tareas</h4>
            {tareasLoading ? <Skeleton className="h-12 w-full" /> : proximasTareas.length > 0 ? (
              <div className="space-y-1">
                {proximasTareas.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm p-1">
                    <span className={t.estado === 'completada' ? 'line-through text-muted-foreground' : ''}>{t.titulo}</span>
                    {t.fecha_limite && new Date(t.fecha_limite) < new Date() && t.estado !== 'completada' && (
                      <AlertCircle className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                ))}
                {tareas.length > 3 && <p className="text-xs text-muted-foreground">+{tareas.length - 3} más</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin tareas</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function WorkspacePage() {
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const { solicitudes, isLoading, updateSolicitud } = useSolicitudes(projectId);

  const handleUpdateEstado = (id: string, estado: string) => {
    updateSolicitud({ id, estado });
  };

  return (
    <ConvocatoriasLayout projectTitle={project?.title}>
      <div className="space-y-6">
        <PageHeader
          title="Workspace"
          description="Gestiona tus solicitudes activas"
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : solicitudes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin solicitudes activas"
            description="Ve a la Biblioteca para solicitar una convocatoria."
          />
        ) : (
          <div className="space-y-4">
            {solicitudes.map((s) => (
              <SolicitudCard key={s.id} solicitud={s} onUpdateEstado={handleUpdateEstado} projectTitle={project?.title} />
            ))}
          </div>
        )}
      </div>
    </ConvocatoriasLayout>
  );
}
