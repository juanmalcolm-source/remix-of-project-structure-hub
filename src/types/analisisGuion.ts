export interface InformacionGeneral {
  titulo: string;
  genero: string;
  subgeneros?: string[];
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
  temas_secundarios?: string[];
  referentes_cinematograficos?: string[];
  publico_objetivo_sugerido?: string;
  potencial_festival?: 'Alto' | 'Medio' | 'Bajo';
  potencial_comercial?: 'Alto' | 'Medio' | 'Bajo';
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
  errores_narrativos?: ErrorNarrativo[];
  conflictos?: AnalisisConflictos;
  ritmo?: AnalisisRitmo;
  tematica?: AnalisisTematico;
}

// ═══════════════════════════════════════════════════════════════
// NUEVAS INTERFACES - ANÁLISIS NARRATIVO PROFUNDO
// ═══════════════════════════════════════════════════════════════

/** Errores o inconsistencias detectados en el guion */
export interface ErrorNarrativo {
  tipo: 'plot_hole' | 'inconsistencia' | 'ritmo' | 'personaje' | 'dialogo' | 'estructura' | 'logica';
  gravedad: 'critico' | 'importante' | 'menor' | 'sugerencia';
  ubicacion: string;
  pagina_aproximada?: number;
  descripcion: string;
  sugerencia_correccion: string;
}

/** Análisis completo de conflictos del guion */
export interface AnalisisConflictos {
  conflicto_principal: Conflicto;
  conflictos_secundarios: Conflicto[];
  conflictos_internos: ConflictoInterno[];
  mapa_tensiones: PuntoTension[];
}

export interface Conflicto {
  tipo: 'persona_vs_persona' | 'persona_vs_sociedad' | 'persona_vs_naturaleza' | 'persona_vs_si_mismo' | 'persona_vs_destino' | 'persona_vs_tecnologia';
  descripcion: string;
  personajes_involucrados: string[];
  detonante: string;
  desarrollo: string;
  resolucion: string;
  resuelto: boolean;
}

export interface ConflictoInterno {
  personaje: string;
  conflicto: string;
  manifestacion: string;
  evolucion: string;
}

export interface PuntoTension {
  pagina_aproximada: number;
  nivel_tension: number; // 1-10
  descripcion: string;
  conflicto_asociado: string;
}

/** Análisis del ritmo y pacing del guion */
export interface AnalisisRitmo {
  ritmo_general: 'lento' | 'moderado' | 'rapido' | 'variable';
  observaciones: string;
  secciones_lentas: SeccionRitmo[];
  secciones_rapidas: SeccionRitmo[];
  equilibrio_dialogo_accion: string;
}

export interface SeccionRitmo {
  paginas: string; // ej: "15-22"
  descripcion: string;
  sugerencia?: string;
}

/** Análisis temático profundo */
export interface AnalisisTematico {
  tema_principal: TemaAnalizado;
  temas_secundarios: TemaAnalizado[];
  simbolismos: Simbolismo[];
  mensaje_universal: string;
}

export interface TemaAnalizado {
  nombre: string;
  descripcion: string;
  como_se_desarrolla: string;
  escenas_clave: string[];
}

export interface Simbolismo {
  elemento: string;
  significado: string;
  apariciones: string[];
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS DAFO DEL GUION (conecta con audiencias y distribución)
// ═══════════════════════════════════════════════════════════════

export interface AnalisisDAFO {
  fortalezas: ElementoDAFO[];
  debilidades: ElementoDAFO[];
  oportunidades: ElementoDAFO[];
  amenazas: ElementoDAFO[];
  score_narrativo: number; // 0-100
  score_comercial: number; // 0-100
  score_festival: number;  // 0-100
  recomendacion_general: string;
}

export interface ElementoDAFO {
  titulo: string;
  descripcion: string;
  impacto: 'alto' | 'medio' | 'bajo';
  categoria: 'narrativa' | 'produccion' | 'mercado' | 'audiencia';
}

// ═══════════════════════════════════════════════════════════════
// MAPA DE RELACIONES ENTRE PERSONAJES
// ═══════════════════════════════════════════════════════════════

export interface RelacionPersonaje {
  personaje_a: string;
  personaje_b: string;
  tipo_relacion: 'aliado' | 'antagonista' | 'mentor' | 'romantica' | 'familiar' | 'profesional' | 'rival' | 'protector';
  descripcion: string;
  evolucion: string;
  escenas_interaccion: number[];
}

// ═══════════════════════════════════════════════════════════════
// DATOS PARA CONEXIÓN CON AUDIENCIAS (downstream para Fase 4)
// ═══════════════════════════════════════════════════════════════

export interface PerfilAudienciaSugerido {
  segmento: string;
  rango_edad: string;
  intereses: string[];
  motivacion_ver: string;
  canales_alcance: string[];
  comparables: string[]; // películas/series similares que vieron
}

export interface PotencialMercado {
  territorios_principales: string[];
  genero_tendencia: 'en_alza' | 'estable' | 'en_baja';
  ventanas_distribucion: string[];
  festivales_sugeridos: string[];
  plataformas_potenciales: string[];
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
  // NUEVOS CAMPOS - Análisis profundo de personaje
  necesidad_dramatica?: string;       // qué necesita el personaje (no qué quiere)
  flaw_principal?: string;            // defecto/debilidad principal
  transformacion?: string;            // cómo cambia de inicio a fin
  ghost?: string;                     // herida del pasado que condiciona sus acciones
  stakes?: string;                    // qué pierde si falla
  funcion_narrativa?: string;         // qué rol cumple en la estructura (mentor, sombra, heraldo, etc.)
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
  // NUEVOS CAMPOS - Fase 1
  analisis_dafo?: AnalisisDAFO;
  relaciones_personajes?: RelacionPersonaje[];
  perfiles_audiencia_sugeridos?: PerfilAudienciaSugerido[];
  potencial_mercado?: PotencialMercado;
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
