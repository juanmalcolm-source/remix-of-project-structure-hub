import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Json } from '@/integrations/supabase/types';

export type BudgetVersion = Tables<'budget_versions'>;

export function useBudgetVersions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['budget_versions', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('budget_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as BudgetVersion[];
    },
    enabled: !!projectId,
  });
}

export function useCreateBudgetVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      versionName,
      notes,
      budgetJson,
      totalAmount,
    }: {
      projectId: string;
      versionName?: string;
      notes?: string;
      budgetJson: Record<string, unknown>;
      totalAmount: number;
    }) => {
      // Get next version number
      const { data: existing } = await supabase
        .from('budget_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version_number ?? 0) + 1;

      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('budget_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          version_name: versionName || `v${nextVersion}`,
          notes: notes || null,
          budget_json: budgetJson as unknown as Json,
          total_amount: totalAmount,
          created_by: user.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_versions', variables.projectId] });
    },
  });
}

export function useDeleteBudgetVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('budget_versions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_versions', variables.projectId] });
    },
  });
}
