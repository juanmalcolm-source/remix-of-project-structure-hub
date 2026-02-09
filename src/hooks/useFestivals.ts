import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useFestivals(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['festivals', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festival_strategies')
        .select('*')
        .eq('project_id', projectId!)
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { nombre: string; pais?: string | null; fecha_limite?: string | null; categoria?: string | null; estrategia?: string | null; prioridad?: string; estado?: string; notas?: string | null }) => {
      const { data, error } = await supabase
        .from('festival_strategies')
        .insert({ project_id: projectId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['festivals', projectId] }); toast({ title: 'Festival creado' }); },
    onError: () => toast({ title: 'Error al crear festival', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('festival_strategies').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['festivals', projectId] }); toast({ title: 'Festival actualizado' }); },
    onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('festival_strategies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['festivals', projectId] }); toast({ title: 'Festival eliminado' }); },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  return {
    festivals: query.data ?? [],
    isLoading: query.isLoading,
    createFestival: createMutation.mutate,
    updateFestival: updateMutation.mutate,
    deleteFestival: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
