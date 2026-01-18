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

// Interfaz para análisis de complejidad detallado (15 factores)
export interface FactoresComplejidad {
  num_personajes: number;           // +1 punto por cada personaje extra después de 2
  movimiento_camara: boolean;       // +2 puntos si true
  accion_fisica: boolean;           // +3 puntos si true (persecuciones, peleas ligeras)
  stunts: boolean;                  // +10 puntos si true (coordinador necesario)
  efectos_especiales: boolean;      // +5 puntos si true
  ninos: boolean;                   // +3 puntos (regulaciones)
  animales: boolean;                // +3 puntos (entrenador)
  vehiculos_movimiento: boolean;    // +5 puntos (coordinación compleja)
  coordinacion_extras: number;      // +1 punto por cada 5 extras
  iluminacion_compleja: boolean;    // +2 puntos (setups elaborados)
  escena_noche: boolean;            // +2 puntos (tiempo limitado)
  exteriores_clima: boolean;        // +2 puntos (dependiente del clima)
  dialogo_extenso: boolean;         // +1 punto (cobertura múltiple)
  requiere_grua: boolean;           // +3 puntos
  planos_especiales: boolean;       // +2 puntos (steadicam, drones)
}

export interface AnalisisComplejidad {
  tipo_escena: 'dialogo_estatico' | 'movimiento' | 'accion' | 'intimista' | 'accion_compleja';
  factores: FactoresComplejidad;
  score_complejidad: number;          // Suma total de puntos (0-100)
  categoria: 'Baja' | 'Media' | 'Alta'; // <10: Baja, 10-25: Media, >25: Alta
  tiempo_setup_estimado_minutos: number;
  paginas_por_dia_sugerido: number;   // 5-6 (Baja), 3-4 (Media), 1-2 (Alta)
}

export interface Secuencia {
  numero_secuencia: number;
  numero_escena: string;
  encabezado: string;
  localizacion: string;
  set_type?: 'INT' | 'EXT';
  momento_dia: string;
  paginas_octavos: number;
  duracion_estimada_minutos?: number;
  personajes: string[];
  attrezzo: string[];
  vestuario: string[];
  vehiculos?: string[];
  efectos_especiales?: string[];
  complejidad_rodaje: 'Baja' | 'Media' | 'Alta';
  // Campos profesionales de tiempo
  complexity_factor?: number; // 1.0, 1.2, 2.0, 3.0
  complexity_reason?: string;
  setup_time_minutes?: number;
  shooting_time_minutes?: number;
  total_time_minutes?: number;
  notas_direccion?: string;
  // NUEVO: Análisis de complejidad detallado
  analisis_complejidad?: AnalisisComplejidad;
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

// Función helper para calcular score de complejidad
export function calcularScoreComplejidad(factores: FactoresComplejidad): number {
  let score = 0;
  
  // +1 punto por cada personaje extra después de 2
  if (factores.num_personajes > 2) {
    score += (factores.num_personajes - 2);
  }
  
  if (factores.movimiento_camara) score += 2;
  if (factores.accion_fisica) score += 3;
  if (factores.stunts) score += 10;
  if (factores.efectos_especiales) score += 5;
  if (factores.ninos) score += 3;
  if (factores.animales) score += 3;
  if (factores.vehiculos_movimiento) score += 5;
  
  // +1 punto por cada 5 extras
  score += Math.floor(factores.coordinacion_extras / 5);
  
  if (factores.iluminacion_compleja) score += 2;
  if (factores.escena_noche) score += 2;
  if (factores.exteriores_clima) score += 2;
  if (factores.dialogo_extenso) score += 1;
  if (factores.requiere_grua) score += 3;
  if (factores.planos_especiales) score += 2;
  
  return Math.min(score, 100); // Cap at 100
}

// Función helper para obtener categoría
export function obtenerCategoriaComplejidad(score: number): 'Baja' | 'Media' | 'Alta' {
  if (score < 10) return 'Baja';
  if (score <= 25) return 'Media';
  return 'Alta';
}

// Función helper para obtener páginas/día sugerido
export function obtenerPaginasPorDia(categoria: 'Baja' | 'Media' | 'Alta'): number {
  switch (categoria) {
    case 'Baja': return 5;
    case 'Media': return 3.5;
    case 'Alta': return 1.5;
  }
}

// Crear factores vacíos por defecto
export function crearFactoresVacios(): FactoresComplejidad {
  return {
    num_personajes: 0,
    movimiento_camara: false,
    accion_fisica: false,
    stunts: false,
    efectos_especiales: false,
    ninos: false,
    animales: false,
    vehiculos_movimiento: false,
    coordinacion_extras: 0,
    iluminacion_compleja: false,
    escena_noche: false,
    exteriores_clima: false,
    dialogo_extenso: false,
    requiere_grua: false,
    planos_especiales: false,
  };
}
