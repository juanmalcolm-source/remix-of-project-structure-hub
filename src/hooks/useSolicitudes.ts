import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSolicitudes(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['solicitudes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*, convocatorias(*)')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { convocatoria_id: string; importe_solicitado?: number | null; estado?: string }) => {
      const { data, error } = await supabase
        .from('solicitudes')
        .insert({ project_id: projectId!, ...input })
        .select('*, convocatorias(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['solicitudes', projectId] }); toast({ title: 'Solicitud creada' }); },
    onError: () => toast({ title: 'Error al crear solicitud', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('solicitudes').update(input).eq('id', id).select('*, convocatorias(*)').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['solicitudes', projectId] }); toast({ title: 'Solicitud actualizada' }); },
    onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('solicitudes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['solicitudes', projectId] }); toast({ title: 'Solicitud eliminada' }); },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  return {
    solicitudes: query.data ?? [],
    isLoading: query.isLoading,
    createSolicitud: createMutation.mutate,
    updateSolicitud: updateMutation.mutate,
    deleteSolicitud: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
