import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConvocatoriaFilters {
  ambitos?: string[];
  tiposObra?: string[];
  soloActivas?: boolean;
  search?: string;
}

export function useConvocatorias(filters?: ConvocatoriaFilters) {
  return useQuery({
    queryKey: ['convocatorias', filters],
    queryFn: async () => {
      let query = supabase.from('convocatorias').select('*').order('fecha_cierre', { ascending: true, nullsFirst: false });

      if (filters?.soloActivas) query = query.eq('activa', true);
      if (filters?.ambitos?.length) query = query.in('ambito', filters.ambitos);
      if (filters?.search) query = query.or(`nombre.ilike.%${filters.search}%,organismo.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;

      let results = data ?? [];
      if (filters?.tiposObra?.length) {
        results = results.filter(c =>
          (c.tipos_obra as string[])?.some(t => filters.tiposObra!.includes(t))
        );
      }
      return results;
    },
  });
}

export function useConvocatoria(id: string | undefined) {
  return useQuery({
    queryKey: ['convocatoria', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('convocatorias').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
