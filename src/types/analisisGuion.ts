export interface InformacionGeneral {
  titulo: string;
  genero: string;
  duracion_estimada_minutos: number;
  paginas_totales: number;
  paginas_dialogo: number;
  paginas_accion: number;
}

export interface Personaje {
  nombre: string;
  categoria: 'PROTAGONISTA' | 'PRINCIPAL' | 'SECUNDARIO' | 'FIGURACION';
  descripcion: string;
  genero: 'Masculino' | 'Femenino' | 'No especificado';
  edad_aproximada: string;
  primera_aparicion: string;
  escenas_aparicion: number[];
  dias_rodaje_estimados: number;
  dialogos_principales: boolean;
  importancia_trama: 'Alta' | 'Media' | 'Baja';
}

export interface Localizacion {
  nombre: string;
  tipo: 'INT' | 'EXT';
  momento_dia: 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER';
  descripcion: string;
  escenas: number[];
  paginas_totales: number;
  dias_rodaje_estimados: number;
  complejidad: 'Baja' | 'Media' | 'Alta';
  necesidades_especiales: string[];
}

export interface Secuencia {
  numero_secuencia: number;
  numero_escena: string;
  encabezado: string;
  localizacion: string;
  momento_dia: string;
  paginas_octavos: number;
  personajes: string[];
  attrezzo: string[];
  vestuario: string[];
  vehiculos?: string[];
  efectos_especiales?: string[];
  complejidad_rodaje: 'Baja' | 'Media' | 'Alta';
}

export interface ResumenProduccion {
  total_personajes: {
    protagonistas: number;
    principales: number;
    secundarios: number;
    figuracion: number;
  };
  total_localizaciones: {
    interiores: number;
    exteriores: number;
  };
  dias_rodaje: {
    estimacion_minima: number;
    estimacion_maxima: number;
    estimacion_recomendada: number;
  };
  complejidad_general: 'Baja' | 'Media' | 'Alta';
}

export interface AnalisisGuion {
  informacion_general: InformacionGeneral;
  personajes: Personaje[];
  localizaciones: Localizacion[];
  desglose_secuencias: Secuencia[];
  resumen_produccion: ResumenProduccion;
}
