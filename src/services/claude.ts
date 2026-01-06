import { supabase } from '@/integrations/supabase/client';

export interface AnalisisGuion {
  titulo: string | null;
  logline: string;
  genero: string;
  sinopsis: string;
  personajes: Array<{
    nombre: string;
    descripcion: string;
  }>;
  localizaciones: string[];
}

export async function analizarGuion(textoGuion: string): Promise<AnalisisGuion> {
  try {
    const { data, error } = await supabase.functions.invoke('analizar-guion', {
      body: { textoGuion }
    });

    if (error) throw error;
    
    return data as AnalisisGuion;
  } catch (error) {
    console.error('Error al analizar guión:', error);
    throw error;
  }
}
