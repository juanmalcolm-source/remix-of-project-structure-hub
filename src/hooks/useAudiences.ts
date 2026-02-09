import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAudiences(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['audiences', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audiences')
        .select('*')
        .eq('project_id', projectId!)
        .order('nombre');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { nombre: string; descripcion?: string | null; rango_edad?: string | null; genero?: string | null; intereses?: string[]; tamano_estimado?: number | null; prioridad?: string }) => {
      const { data, error } = await supabase
        .from('audiences')
        .insert({ project_id: projectId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences', projectId] });
      toast({ title: 'Segmento creado' });
    },
    onError: () => toast({ title: 'Error al crear segmento', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('audiences')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences', projectId] });
      toast({ title: 'Segmento actualizado' });
    },
    onError: () => toast({ title: 'Error al actualizar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('audiences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiences', projectId] });
      toast({ title: 'Segmento eliminado' });
    },
    onError: () => toast({ title: 'Error al eliminar', variant: 'destructive' }),
  });

  return {
    audiences: query.data ?? [],
    isLoading: query.isLoading,
    createAudience: createMutation.mutate,
    updateAudience: updateMutation.mutate,
    deleteAudience: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
