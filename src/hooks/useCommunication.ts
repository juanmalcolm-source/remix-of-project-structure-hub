import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCommunication(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['communication', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_strategies')
        .select('*')
        .eq('project_id', projectId!)
        .order('fecha_inicio', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { canal: string; accion: string; fase?: string; fecha_inicio?: string | null; fecha_fin?: string | null; presupuesto?: number | null; estado?: string }) => {
      const { data, error } = await supabase
        .from('communication_strategies')
        .insert({ project_id: projectId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', projectId] });
      toast({ title: 'Creado', description: 'Acción de comunicación creada correctamente' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('communication_strategies').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', projectId] });
      toast({ title: 'Actualizado', description: 'Cambios guardados' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('communication_strategies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication', projectId] });
      toast({ title: 'Eliminado', description: 'Acción eliminada', variant: 'destructive' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return {
    strategies: query.data ?? [],
    isLoading: query.isLoading,
    createStrategy: createMutation.mutate,
    updateStrategy: updateMutation.mutate,
    deleteStrategy: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
