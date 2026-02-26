import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BudgetLine = Tables<'budget_lines'>;
export type BudgetLineInsert = TablesInsert<'budget_lines'>;
export type BudgetLineUpdate = TablesUpdate<'budget_lines'>;

export function useBudgetLines(projectId: string | undefined) {
  return useQuery({
    queryKey: ['budget_lines', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('project_id', projectId)
        .order('chapter', { ascending: true })
        .order('account_number', { ascending: true });
      
      if (error) throw error;
      return data as BudgetLine[];
    },
    enabled: !!projectId,
  });
}

export function useCreateBudgetLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (line: BudgetLineInsert) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .insert(line)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines', variables.project_id] });
    },
  });
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId, updates }: { id: string; projectId: string; updates: BudgetLineUpdate }) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines', variables.projectId] });
    },
  });
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('budget_lines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines', variables.projectId] });
    },
  });
}

export function useBulkCreateBudgetLines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, lines }: { projectId: string; lines: Omit<BudgetLineInsert, 'project_id'>[] }) => {
      // Snapshot existing lines for rollback if insert fails
      const { data: existing } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('project_id', projectId);

      // Delete existing lines
      const { error: deleteError } = await supabase
        .from('budget_lines')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      // Prepare new lines — exclude 'total' as it's a generated column
      const linesToInsert = lines.map(line => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total, ...lineWithoutTotal } = line;
        return {
          ...lineWithoutTotal,
          project_id: projectId,
        };
      });

      const { data, error: insertError } = await supabase
        .from('budget_lines')
        .insert(linesToInsert)
        .select();

      if (insertError) {
        // Rollback: re-insert the original lines preserving IDs
        if (existing && existing.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const rollback = existing.map(({ total, ...rest }) => rest);
          await supabase.from('budget_lines').insert(rollback);
        }
        throw insertError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines', variables.projectId] });
    },
  });
}
