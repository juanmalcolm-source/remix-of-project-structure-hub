export interface InformacionGeneral {
  titulo: string;
  genero: string;
  duracion_estimada_minutos: number;
  paginas_totales: number;
  paginas_dialogo: number;
  paginas_accion: number;
  tono?: string;
  estilo_visual_sugerido?: string;
  logline?: string;
  synopsis?: string;
  core_emotional?: string;
  central_theme?: string;
}

export interface EstructuraActo {
  acto: number;
  descripcion: string;
  paginas_inicio: number;
  paginas_fin: number;
}

export interface PuntoDeGiro {
  nombre: string;
  pagina_aproximada: number;
  descripcion: string;
}

export interface PuntoCurvaEmocional {
  momento: string;
  emocion: string;
  intensidad: number;
}

export interface AnalisisNarrativo {
  estructura_actos: EstructuraActo[];
  puntos_de_giro: PuntoDeGiro[];
  curva_emocional: PuntoCurvaEmocional[];
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
  arco_dramatico?: string;
  motivaciones?: string;
  conflictos?: string;
  relaciones_clave?: string[];
}

export interface Localizacion {
  nombre: string;
  tipo: 'INT' | 'EXT';
  momento_dia: 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER';
  descripcion: string;
  ambiente?: string;
  escenas: number[];
  paginas_totales: number;
  dias_rodaje_estimados: number;
  complejidad: 'Baja' | 'Media' | 'Alta';
  necesidades_especiales: string[];
  requisitos_tecnicos?: string[];
}

export interface Secuencia {
  numero_secuencia: number;
  numero_escena: string;
  encabezado: string;
  localizacion: string;
  momento_dia: string;
  paginas_octavos: number;
  duracion_estimada_minutos?: number;
  personajes: string[];
  attrezzo: string[];
  vestuario: string[];
  vehiculos?: string[];
  efectos_especiales?: string[];
  complejidad_rodaje: 'Baja' | 'Media' | 'Alta';
  notas_direccion?: string;
}

export interface Viabilidad {
  fortalezas: string[];
  debilidades: string[];
  sugerencias_mejora: string[];
  factores_positivos: string[];
  factores_negativos: string[];
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
  elementos_destacados?: string[];
}

export interface AnalisisGuion {
  informacion_general: InformacionGeneral;
  analisis_narrativo?: AnalisisNarrativo;
  personajes: Personaje[];
  localizaciones: Localizacion[];
  desglose_secuencias: Secuencia[];
  viabilidad?: Viabilidad;
  resumen_produccion: ResumenProduccion;
}
