import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Json } from '@/integrations/supabase/types';

export type SequenceRow = Tables<'sequences'>;

export function useSequences(projectId: string | undefined) {
  return useQuery({
    queryKey: ['sequences', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true });
      if (error) throw error;
      return data as SequenceRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateSequence() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TablesInsert<'sequences'>) => {
      const { error } = await supabase.from('sequences').insert(data);
      if (error) throw error;
      return data.project_id;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['sequences', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Secuencia creada' });
    },
    onError: () => {
      toast({ title: 'Error al crear secuencia', variant: 'destructive' });
    },
  });
}

export function useUpdateSequence() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: TablesUpdate<'sequences'> }) => {
      const { error } = await supabase.from('sequences').update(data).eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['sequences', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Secuencia actualizada' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    },
  });
}

export function useDeleteSequence() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('sequences').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['sequences', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Secuencia eliminada' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    },
  });
}
