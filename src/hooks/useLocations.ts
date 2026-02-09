import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LocationRow = Tables<'locations'>;
export type LocationDistanceRow = Tables<'location_distances'>;

export function useLocations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['locations', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      if (error) throw error;
      return data as LocationRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TablesInsert<'locations'>) => {
      const { error } = await supabase.from('locations').insert(data);
      if (error) throw error;
      return data.project_id;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['locations', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Localización creada' });
    },
    onError: () => {
      toast({ title: 'Error al crear localización', variant: 'destructive' });
    },
  });
}

export function useUpdateLocationMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: TablesUpdate<'locations'> }) => {
      const { error } = await supabase.from('locations').update(data).eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['locations', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Localización actualizada' });
    },
    onError: () => {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    },
  });
}

export function useDeleteLocationMutation() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['locations', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      toast({ title: 'Localización eliminada' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    },
  });
}

export function useLocationDistances(projectId: string | undefined) {
  return useQuery({
    queryKey: ['location_distances', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('location_distances')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;
      return data as LocationDistanceRow[];
    },
    enabled: !!projectId,
  });
}

export function useSaveDistances() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, entries }: {
      projectId: string;
      entries: Array<{
        from_location_id: string;
        to_location_id: string;
        distance_km: number;
        duration_minutes: number;
      }>;
    }) => {
      // Delete existing distances for this project
      await supabase.from('location_distances').delete().eq('project_id', projectId);

      if (entries.length === 0) return projectId;

      const rows = entries.map((e) => ({
        project_id: projectId,
        from_location_id: e.from_location_id,
        to_location_id: e.to_location_id,
        distance_km: e.distance_km,
        duration_minutes: e.duration_minutes,
        source: 'haversine' as const,
      }));

      const { error } = await supabase.from('location_distances').insert(rows);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ['location_distances', projectId] });
      toast({ title: 'Distancias calculadas y guardadas' });
    },
    onError: () => {
      toast({ title: 'Error al guardar distancias', variant: 'destructive' });
    },
  });
}
