import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardData(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('No projectId');

      const today = new Date().toISOString().split('T')[0];

      const [
        convocatoriasRes,
        solicitudesRes,
        buyerPersonasRes,
        tareasRes,
        proximosCierresRes,
        actividadConvocatoriasRes,
        actividadSolicitudesRes,
        actividadTareasRes,
      ] = await Promise.all([
        // Convocatorias activas (fecha_cierre > hoy)
        supabase.from('convocatorias').select('id, nombre, organismo, fecha_cierre').gte('fecha_cierre', today).order('fecha_cierre', { ascending: true }),
        // Solicitudes en curso
        supabase.from('solicitudes').select('id, estado, created_at, convocatoria_id').eq('project_id', projectId).neq('estado', 'rechazada'),
        // Buyer personas count
        supabase.from('buyer_personas').select('id').eq('project_id', projectId),
        // Tareas pendientes
        supabase.from('tareas_solicitud').select('id, titulo, estado, created_at, solicitud_id').neq('estado', 'completada'),
        // Próximos 5 cierres
        supabase.from('convocatorias').select('id, nombre, organismo, fecha_cierre').gte('fecha_cierre', today).order('fecha_cierre', { ascending: true }).limit(5),
        // Actividad reciente: últimas convocatorias
        supabase.from('convocatorias').select('id, nombre, created_at').order('created_at', { ascending: false }).limit(5),
        // Actividad reciente: últimas solicitudes
        supabase.from('solicitudes').select('id, estado, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5),
        // Actividad reciente: últimas tareas
        supabase.from('tareas_solicitud').select('id, titulo, estado, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      // Build activity timeline
      const activities: Array<{ id: string; type: 'convocatoria' | 'solicitud' | 'tarea'; label: string; created_at: string }> = [];

      (actividadConvocatoriasRes.data || []).forEach((c) => {
        activities.push({ id: c.id, type: 'convocatoria', label: `Convocatoria añadida: ${c.nombre}`, created_at: c.created_at });
      });
      (actividadSolicitudesRes.data || []).forEach((s) => {
        activities.push({ id: s.id, type: 'solicitud', label: `Solicitud creada (${s.estado || 'borrador'})`, created_at: s.created_at });
      });
      (actividadTareasRes.data || []).forEach((t) => {
        activities.push({ id: t.id, type: 'tarea', label: `Tarea: ${t.titulo}`, created_at: t.created_at });
      });

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const convocatoriasActivas = convocatoriasRes.data || [];
      const proximoCierre = convocatoriasActivas[0] || null;

      return {
        convocatoriasActivas: convocatoriasActivas.length,
        solicitudesEnCurso: (solicitudesRes.data || []).length,
        buyerPersonas: (buyerPersonasRes.data || []).length,
        tareasPendientes: (tareasRes.data || []).length,
        proximoCierre,
        proximosCierres: proximosCierresRes.data || [],
        actividad: activities.slice(0, 10),
      };
    },
    enabled: !!projectId,
  });
}
