import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSolicitudDocumentos(solicitudId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['solicitud_documentos', solicitudId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitud_documentos')
        .select('*')
        .eq('solicitud_id', solicitudId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!solicitudId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { tipo: string; nombre: string; estado?: string }) => {
      const { data, error } = await supabase
        .from('solicitud_documentos')
        .insert({ solicitud_id: solicitudId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitud_documentos', solicitudId] });
      toast({ title: 'Documento creado' });
    },
    onError: () => toast({ title: 'Error al crear documento', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('solicitud_documentos')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitud_documentos', solicitudId] });
      toast({ title: 'Documento actualizado' });
    },
    onError: () => toast({ title: 'Error al actualizar documento', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('solicitud_documentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitud_documentos', solicitudId] });
      toast({ title: 'Documento eliminado' });
    },
    onError: () => toast({ title: 'Error al eliminar documento', variant: 'destructive' }),
  });

  return {
    documentos: query.data ?? [],
    isLoading: query.isLoading,
    createDocumento: createMutation.mutate,
    updateDocumento: updateMutation.mutate,
    deleteDocumento: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
