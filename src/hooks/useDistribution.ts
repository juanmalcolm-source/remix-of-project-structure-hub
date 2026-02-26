import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDistribution(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['distribution', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_plans')
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { canal: string; territorio?: string | null; ventana?: string | null; estrategia?: string | null; ingreso_estimado?: number | null }) => {
      const { data, error } = await supabase
        .from('distribution_plans')
        .insert({ project_id: projectId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution', projectId] });
      toast({ title: 'Creado', description: 'Plan de distribución creado correctamente' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('distribution_plans').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution', projectId] });
      toast({ title: 'Actualizado', description: 'Cambios guardados' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('distribution_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution', projectId] });
      toast({ title: 'Eliminado', description: 'Plan eliminado', variant: 'destructive' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    createPlan: createMutation.mutate,
    createPlanAsync: createMutation.mutateAsync,
    updatePlan: updateMutation.mutate,
    deletePlan: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
