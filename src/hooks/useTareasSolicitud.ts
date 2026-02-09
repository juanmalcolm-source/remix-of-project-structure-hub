import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useTareasSolicitud(solicitudId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tareas_solicitud', solicitudId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tareas_solicitud')
        .select('*')
        .eq('solicitud_id', solicitudId!)
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!solicitudId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { titulo: string; descripcion?: string; fecha_limite?: string; prioridad?: string; estado?: string }) => {
      const { data, error } = await supabase
        .from('tareas_solicitud')
        .insert({ solicitud_id: solicitudId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas_solicitud', solicitudId] });
      toast({ title: 'Tarea creada' });
    },
    onError: () => toast({ title: 'Error al crear tarea', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('tareas_solicitud')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas_solicitud', solicitudId] });
      toast({ title: 'Tarea actualizada' });
    },
    onError: () => toast({ title: 'Error al actualizar tarea', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tareas_solicitud').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tareas_solicitud', solicitudId] });
      toast({ title: 'Tarea eliminada' });
    },
    onError: () => toast({ title: 'Error al eliminar tarea', variant: 'destructive' }),
  });

  return {
    tareas: query.data ?? [],
    isLoading: query.isLoading,
    createTarea: createMutation.mutate,
    updateTarea: updateMutation.mutate,
    deleteTarea: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
