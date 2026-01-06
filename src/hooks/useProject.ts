import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Project = Tables<'projects'>;
export type Character = Tables<'characters'>;
export type Location = Tables<'locations'>;
export type Sequence = Tables<'sequences'>;
export type CreativeAnalysis = Tables<'creative_analysis'>;
export type FinancingPlan = Tables<'financing_plan'>;
export type FinancingSource = Tables<'financing_sources'>;
export type ProductionNotes = Tables<'production_notes'>;

interface ProjectWithRelations extends Project {
  characters?: Character[];
  locations?: Location[];
  sequences?: Sequence[];
  creative_analysis?: CreativeAnalysis;
  financing_plan?: FinancingPlan;
  financing_sources?: FinancingSource[];
  production_notes?: ProductionNotes;
}

export function useProjects() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        toast({ title: 'Error al cargar proyectos', variant: 'destructive' });
        throw error;
      }
      return data as Project[];
    },
  });
}

export function useProject(projectId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');

      const [
        projectResult,
        analysisResult,
        charactersResult,
        locationsResult,
        sequencesResult,
        financingPlanResult,
        financingSourcesResult,
        productionNotesResult,
      ] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('creative_analysis').select('*').eq('project_id', projectId).maybeSingle(),
        supabase.from('characters').select('*').eq('project_id', projectId).order('category'),
        supabase.from('locations').select('*').eq('project_id', projectId).order('name'),
        supabase.from('sequences').select('*').eq('project_id', projectId).order('sequence_number'),
        supabase.from('financing_plan').select('*').eq('project_id', projectId).maybeSingle(),
        supabase.from('financing_sources').select('*').eq('project_id', projectId).order('created_at'),
        supabase.from('production_notes').select('*').eq('project_id', projectId).maybeSingle(),
      ]);

      if (projectResult.error) throw projectResult.error;

      return {
        ...projectResult.data,
        creative_analysis: analysisResult.data || undefined,
        characters: charactersResult.data || [],
        locations: locationsResult.data || [],
        sequences: sequencesResult.data || [],
        financing_plan: financingPlanResult.data || undefined,
        financing_sources: financingSourcesResult.data || [],
        production_notes: productionNotesResult.data || undefined,
      } as ProjectWithRelations;
    },
    enabled: !!projectId,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TablesUpdate<'projects'> }) => {
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    },
  });
}

export function useUpdateCreativeAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: TablesUpdate<'creative_analysis'> }) => {
      const { error } = await supabase
        .from('creative_analysis')
        .update(data)
        .eq('project_id', projectId);
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: () => {
      toast({ title: 'Error al guardar análisis', variant: 'destructive' });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: TablesUpdate<'characters'> }) => {
      const { error } = await supabase.from('characters').update(data).eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Omit<TablesInsert<'characters'>, 'project_id'> }) => {
      const { error } = await supabase.from('characters').insert({ ...data, project_id: projectId });
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: TablesUpdate<'locations'> }) => {
      const { error } = await supabase.from('locations').update(data).eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Omit<TablesInsert<'locations'>, 'project_id'> }) => {
      const { error } = await supabase.from('locations').insert({ ...data, project_id: projectId });
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateFinancingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: TablesUpdate<'financing_plan'> }) => {
      // First check if exists
      const { data: existing } = await supabase
        .from('financing_plan')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('financing_plan').update(data).eq('project_id', projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('financing_plan').insert({ ...data, project_id: projectId });
        if (error) throw error;
      }
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useFinancingSources(projectId: string | undefined) {
  return useQuery({
    queryKey: ['financing_sources', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('financing_sources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');
      if (error) throw error;
      return data as FinancingSource[];
    },
    enabled: !!projectId,
  });
}

export function useCreateFinancingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Omit<TablesInsert<'financing_sources'>, 'project_id'> }) => {
      const { error } = await supabase.from('financing_sources').insert({ ...data, project_id: projectId });
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['financing_sources', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateFinancingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, data }: { id: string; projectId: string; data: TablesUpdate<'financing_sources'> }) => {
      const { error } = await supabase.from('financing_sources').update(data).eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['financing_sources', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteFinancingSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('financing_sources').delete().eq('id', id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['financing_sources', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateProductionNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: TablesUpdate<'production_notes'> }) => {
      const { data: existing } = await supabase
        .from('production_notes')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('production_notes').update(data).eq('project_id', projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('production_notes').insert({ ...data, project_id: projectId });
        if (error) throw error;
      }
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Proyecto eliminado' });
    },
    onError: () => {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    },
  });
}
