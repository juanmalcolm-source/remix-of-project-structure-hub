import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBuyerPersonas(projectId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['buyer-personas', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .select('*')
        .eq('project_id', projectId!)
        .order('nombre');
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { nombre: string; edad?: number | null; ocupacion?: string | null; biografia?: string | null; motivaciones?: string[]; frustraciones?: string[]; medios?: string[]; objetivos?: string[] }) => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .insert({ project_id: projectId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-personas', projectId] });
      toast({ title: 'Creado', description: 'Buyer Persona creado correctamente' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('buyer_personas')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-personas', projectId] });
      toast({ title: 'Actualizado', description: 'Cambios guardados' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('buyer_personas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-personas', projectId] });
      toast({ title: 'Eliminado', description: 'Buyer Persona eliminado', variant: 'destructive' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return {
    personas: query.data ?? [],
    isLoading: query.isLoading,
    createPersona: createMutation.mutate,
    updatePersona: updateMutation.mutate,
    deletePersona: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
