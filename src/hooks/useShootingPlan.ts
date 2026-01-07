import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  generateSmartShootingPlan, 
  saveShootingPlan, 
  loadShootingPlan,
  ProposedShootingDay,
  PlanGenerationOptions 
} from "@/services/shootingPlanService";
import { toast } from "sonner";

export function useShootingPlan(projectId: string) {
  const queryClient = useQueryClient();

  // Query for sequences with shooting data
  const { data: sequences = [], isLoading: sequencesLoading } = useQuery({
    queryKey: ['sequences', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Query for locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Query for saved shooting days
  const { data: shootingDays = [], isLoading: daysLoading, refetch: refetchDays } = useQuery({
    queryKey: ['shooting_days', projectId],
    queryFn: async () => {
      return loadShootingPlan(projectId);
    },
    enabled: !!projectId,
  });

  // Mutation to generate and save plan
  const generatePlanMutation = useMutation({
    mutationFn: async (options: PlanGenerationOptions) => {
      const plan = generateSmartShootingPlan(sequences, locations, options);
      const result = await saveShootingPlan(projectId, plan);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Plan de rodaje generado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al generar plan: ${error.message}`);
    },
  });

  // Mutation to update a single day
  const updateDayMutation = useMutation({
    mutationFn: async ({ dayNumber, updates }: { dayNumber: number; updates: Partial<ProposedShootingDay> }) => {
      const { error } = await supabase
        .from('shooting_days')
        .update({
          shooting_date: updates.dayNumber ? undefined : undefined,
          location_name: updates.location,
          time_of_day: updates.timeOfDay,
          notes: updates.warnings?.join('; '),
          total_eighths: updates.totalEighths,
          estimated_hours: updates.estimatedHours,
        })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
    },
  });

  // Mutation to delete a day
  const deleteDayMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const { error } = await supabase
        .from('shooting_days')
        .delete()
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
      
      if (error) throw error;
      
      // Renumber remaining days
      const remainingDays = shootingDays
        .filter((d) => d.dayNumber !== dayNumber)
        .sort((a, b) => a.dayNumber - b.dayNumber);
      
      for (let i = 0; i < remainingDays.length; i++) {
        const newNumber = i + 1;
        if (remainingDays[i].dayNumber !== newNumber) {
          await supabase
            .from('shooting_days')
            .update({ day_number: newNumber })
            .eq('project_id', projectId)
            .eq('day_number', remainingDays[i].dayNumber);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Día eliminado');
    },
  });

  // Mutation to move scene between days
  const moveSceneMutation = useMutation({
    mutationFn: async ({ 
      sceneId, 
      fromDayNumber, 
      toDayNumber 
    }: { 
      sceneId: string; 
      fromDayNumber: number; 
      toDayNumber: number;
    }) => {
      const fromDay = shootingDays.find((d) => d.dayNumber === fromDayNumber);
      const toDay = shootingDays.find((d) => d.dayNumber === toDayNumber);
      
      if (!fromDay || !toDay) throw new Error('Día no encontrado');
      
      const scene = fromDay.scenes.find((s) => s.id === sceneId);
      if (!scene) throw new Error('Escena no encontrada');
      
      // Update from day (remove scene)
      const newFromScenes = fromDay.scenes.filter((s) => s.id !== sceneId);
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: newFromScenes as unknown as null, // Cast to satisfy JSON type
          total_eighths: newFromScenes.reduce((sum, s: any) => sum + (s.effectiveEighths || s.page_eighths || 1), 0),
        })
        .eq('project_id', projectId)
        .eq('day_number', fromDayNumber);
      
      // Update to day (add scene)
      const newToScenes = [...toDay.scenes, scene];
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: newToScenes as unknown as null, // Cast to satisfy JSON type
          total_eighths: newToScenes.reduce((sum, s: any) => sum + (s.effectiveEighths || s.page_eighths || 1), 0),
        })
        .eq('project_id', projectId)
        .eq('day_number', toDayNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Escena movida');
    },
  });

  // Mutation to clear the entire plan
  const clearPlanMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shooting_days')
        .delete()
        .eq('project_id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Plan de rodaje eliminado');
    },
  });

  return {
    sequences,
    locations,
    shootingDays,
    isLoading: sequencesLoading || locationsLoading || daysLoading,
    generatePlan: generatePlanMutation.mutate,
    isGenerating: generatePlanMutation.isPending,
    updateDay: updateDayMutation.mutate,
    deleteDay: deleteDayMutation.mutate,
    moveScene: moveSceneMutation.mutate,
    clearPlan: clearPlanMutation.mutate,
    refetchDays,
  };
}
