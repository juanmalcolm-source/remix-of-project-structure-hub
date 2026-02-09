import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export function useAnalisisSolicitud(solicitudId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['analisis_solicitud', solicitudId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analisis_solicitud')
        .select('*')
        .eq('solicitud_id', solicitudId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!solicitudId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { tipo: string; resultado: Json }) => {
      const { data, error } = await supabase
        .from('analisis_solicitud')
        .insert({ solicitud_id: solicitudId!, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analisis_solicitud', solicitudId] });
      toast({ title: 'Creado', description: 'Análisis guardado correctamente' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return {
    analisis: query.data ?? [],
    isLoading: query.isLoading,
    createAnalisis: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
