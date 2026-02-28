import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  generateSmartShootingPlan,
  saveShootingPlan,
  loadShootingPlan,
  ProposedShootingDay,
  PlanGenerationOptions,
  SceneForPlanning,
  calculateEffectiveEighths,
  parseTimeOfDay,
  recalculateDayTime,
  calculateDayTimeWithLocationOptimization,
} from "@/services/shootingPlanService";
import { generarPlanRodajeConIA, type AIShootingPlanResponse } from "@/services/shootingPlanAIService";
import { toast } from "sonner";

// Helper to get unique locations from scenes
function getUniqueLocations(scenes: SceneForPlanning[]): string[] {
  return [...new Set(scenes.map((s) => s.location_name).filter(Boolean))];
}

export function useShootingPlan(projectId: string) {
  const queryClient = useQueryClient();
  const [aiSummary, setAiSummary] = useState<AIShootingPlanResponse['summary'] | null>(null);

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

  // Calculate unassigned scenes
  const unassignedScenes = useMemo(() => {
    const assignedIds = new Set(
      shootingDays.flatMap(day => day.scenes.map((s) => s.id))
    );
    return sequences.filter(seq => !assignedIds.has(seq.id));
  }, [sequences, shootingDays]);

  // Mutation to generate and save plan
  const generatePlanMutation = useMutation({
    mutationFn: async (options: PlanGenerationOptions) => {
      // If grouping by zone, add location zones to options
      if (options.groupBy === 'zone') {
        const locationZones = new Map<string, string>();
        for (const loc of locations) {
          if (loc.zone) {
            locationZones.set(loc.id, loc.zone);
          }
        }
        options.locationZones = locationZones;
      }
      
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
      const updateData: Record<string, unknown> = {};

      if (updates.location !== undefined) updateData.location_name = updates.location;
      if (updates.timeOfDay !== undefined) updateData.time_of_day = updates.timeOfDay;
      if (updates.totalEighths !== undefined) updateData.total_eighths = updates.totalEighths;
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours;
      if (updates.warnings !== undefined) updateData.notes = updates.warnings.join('; ');
      if (updates.scenes !== undefined) {
        updateData.sequences = updates.scenes;
        updateData.total_eighths = updates.scenes.reduce((sum: number, s: SceneForPlanning) =>
          sum + (s.effectiveEighths || s.page_eighths || 1), 0);
      }
      if (updates.characters !== undefined) updateData.characters = updates.characters;
      
      const { error } = await supabase
        .from('shooting_days')
        .update(updateData)
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
    },
  });

  // Mutation to delete a day and renumber
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

  // Mutation to add a new day
  const addDayMutation = useMutation({
    mutationFn: async (newDay: {
      location: string;
      locationId?: string;
      timeOfDay: string;
      notes?: string;
      scenes?: SceneForPlanning[];
    }) => {
      const nextDayNumber = shootingDays.length + 1;
      const scenes = newDay.scenes || [];
      const totalEighths = scenes.reduce((sum, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
      const characters = [...new Set(scenes.flatMap(s => s.characters || []))];
      
      const { error } = await supabase
        .from('shooting_days')
        .insert({
          project_id: projectId,
          day_number: nextDayNumber,
          location_name: newDay.location,
          location_id: newDay.locationId || null,
          time_of_day: newDay.timeOfDay,
          notes: newDay.notes || null,
          sequences: scenes as unknown as null,
          characters: characters as unknown as null,
          total_eighths: totalEighths,
          estimated_hours: recalculateDayTime(scenes),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Jornada añadida');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
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
      const fromCharacters = [...new Set(newFromScenes.flatMap((s) => s.characters || []))];
      const fromTotalEighths = newFromScenes.reduce((sum: number, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
      const fromTimeResult = calculateDayTimeWithLocationOptimization(newFromScenes);
      const fromLocations = getUniqueLocations(newFromScenes);
      
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: newFromScenes as unknown as null,
          characters: fromCharacters as unknown as null,
          total_eighths: fromTotalEighths,
          estimated_hours: fromTimeResult.totalHours,
          location_name: fromLocations.length > 0 
            ? (fromLocations.length > 1 ? `${fromLocations[0]} + ${fromLocations.length - 1} más` : fromLocations[0])
            : 'Sin localización',
        })
        .eq('project_id', projectId)
        .eq('day_number', fromDayNumber);
      
      // Update to day (add scene)
      const newToScenes = [...toDay.scenes, scene];
      const toCharacters = [...new Set(newToScenes.flatMap((s) => s.characters || []))];
      const toTotalEighths = newToScenes.reduce((sum: number, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
      const toTimeResult = calculateDayTimeWithLocationOptimization(newToScenes);
      const toLocations = getUniqueLocations(newToScenes);
      
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: newToScenes as unknown as null,
          characters: toCharacters as unknown as null,
          total_eighths: toTotalEighths,
          estimated_hours: toTimeResult.totalHours,
          location_name: toLocations.length > 0 
            ? (toLocations.length > 1 ? `${toLocations[0]} + ${toLocations.length - 1} más` : toLocations[0])
            : 'Sin localización',
        })
        .eq('project_id', projectId)
        .eq('day_number', toDayNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Escena movida');
    },
  });

  // Mutation to add scene to a day (from unassigned)
  const addSceneToDayMutation = useMutation({
    mutationFn: async ({ 
      sequenceId, 
      dayNumber 
    }: { 
      sequenceId: string; 
      dayNumber: number;
    }) => {
      const day = shootingDays.find((d) => d.dayNumber === dayNumber);
      if (!day) throw new Error('Día no encontrado');
      
      const sequence = sequences.find((s) => s.id === sequenceId);
      if (!sequence) throw new Error('Escena no encontrada');
      
      const pageEighths = sequence.page_eighths || 1;
      const complexity = sequence.scene_complexity || 'media';
      
      const newScene: SceneForPlanning = {
        id: sequence.id,
        sequence_number: sequence.sequence_number,
        title: sequence.title || `Escena ${sequence.sequence_number}`,
        description: sequence.description || '',
        location_name: day.location,
        location_id: day.locationId,
        time_of_day: sequence.time_of_day || parseTimeOfDay(sequence.title || ''),
        page_eighths: pageEighths,
        scene_complexity: complexity,
        characters: Array.isArray(sequence.characters_in_scene) 
          ? (sequence.characters_in_scene as string[]) 
          : [],
        effectiveEighths: calculateEffectiveEighths(pageEighths, complexity),
      };
      
      const newScenes = [...day.scenes, newScene];
      const newCharacters = [...new Set(newScenes.flatMap((s) => s.characters || []))];
      const newTotalEighths = newScenes.reduce((sum: number, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);

      await supabase
        .from('shooting_days')
        .update({
          sequences: newScenes as unknown as null,
          characters: newCharacters as unknown as null,
          total_eighths: newTotalEighths,
          estimated_hours: recalculateDayTime(newScenes),
        })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Escena añadida al día');
    },
  });

  // Mutation to remove scene from a day (back to unassigned)
  const removeSceneFromDayMutation = useMutation({
    mutationFn: async ({
      sceneId,
      dayNumber
    }: {
      sceneId: string;
      dayNumber: number;
    }) => {
      const day = shootingDays.find((d) => d.dayNumber === dayNumber);
      if (!day) throw new Error('Día no encontrado');

      const newScenes = day.scenes.filter((s) => s.id !== sceneId);
      const newCharacters = [...new Set(newScenes.flatMap((s) => s.characters || []))];
      const newTotalEighths = newScenes.reduce((sum: number, s) => sum + (s.effectiveEighths || s.page_eighths || 1), 0);
      
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: newScenes as unknown as null,
          characters: newCharacters as unknown as null,
          total_eighths: newTotalEighths,
          estimated_hours: recalculateDayTime(newScenes),
        })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Escena quitada del día');
    },
  });

  // Mutation to reorder scenes within a day
  const reorderScenesMutation = useMutation({
    mutationFn: async ({ 
      dayNumber, 
      sceneIds 
    }: { 
      dayNumber: number; 
      sceneIds: string[];
    }) => {
      const day = shootingDays.find((d) => d.dayNumber === dayNumber);
      if (!day) throw new Error('Día no encontrado');
      
      // Reorder scenes based on sceneIds array
      const reorderedScenes = sceneIds
        .map(id => day.scenes.find((s) => s.id === id))
        .filter(Boolean);
      
      await supabase
        .from('shooting_days')
        .update({ 
          sequences: reorderedScenes as unknown as null,
        })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
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

  // Mutation to swap day positions
  const swapDaysMutation = useMutation({
    mutationFn: async ({ 
      dayNumber1, 
      dayNumber2 
    }: { 
      dayNumber1: number; 
      dayNumber2: number;
    }) => {
      // Use a temporary number to avoid unique constraint issues
      const tempNumber = 999999;
      
      await supabase
        .from('shooting_days')
        .update({ day_number: tempNumber })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber1);
      
      await supabase
        .from('shooting_days')
        .update({ day_number: dayNumber1 })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber2);
      
      await supabase
        .from('shooting_days')
        .update({ day_number: dayNumber2 })
        .eq('project_id', projectId)
        .eq('day_number', tempNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success('Días intercambiados');
    },
  });

  // AI-powered plan generation mutation
  const generatePlanAIMutation = useMutation({
    mutationFn: async (options: {
      productionType: string;
      targetHoursPerDay: number;
      maxEighthsPerDay: number;
      separateDayNight: boolean;
    }) => {
      const aiResponse = await generarPlanRodajeConIA(
        projectId,
        sequences,
        locations,
        options
      );

      // Save the generated plan using the same pipeline as the algorithmic generator
      const result = await saveShootingPlan(projectId, aiResponse.shootingDays);
      if (!result.success) {
        throw new Error(result.error);
      }

      return aiResponse;
    },
    onSuccess: (aiResponse) => {
      setAiSummary(aiResponse.summary);
      queryClient.invalidateQueries({ queryKey: ['shooting_days', projectId] });
      toast.success(`Plan de rodaje IA generado: ${aiResponse.summary.totalDays} días de rodaje`);
    },
    onError: (error: Error) => {
      toast.error(`Error IA: ${error.message}`);
    },
  });

  return {
    sequences,
    locations,
    shootingDays,
    unassignedScenes,
    isLoading: sequencesLoading || locationsLoading || daysLoading,
    generatePlan: generatePlanMutation.mutate,
    isGenerating: generatePlanMutation.isPending,
    generatePlanWithAI: generatePlanAIMutation.mutate,
    isGeneratingAI: generatePlanAIMutation.isPending,
    aiSummary,
    updateDay: updateDayMutation.mutate,
    deleteDay: deleteDayMutation.mutate,
    addDay: addDayMutation.mutate,
    moveScene: moveSceneMutation.mutate,
    addSceneToDay: addSceneToDayMutation.mutate,
    removeSceneFromDay: removeSceneFromDayMutation.mutate,
    reorderScenes: reorderScenesMutation.mutate,
    swapDays: swapDaysMutation.mutate,
    clearPlan: clearPlanMutation.mutate,
    refetchDays,
  };
}
