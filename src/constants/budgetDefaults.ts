// =============================================================================
// Constantes de cotizacion SS e IRPF — Legislacion espanola 2025
// Fuente: BOE Orden PJC/178/2025, RD 31/2023
// =============================================================================

/** Desglose cotizacion SS a cargo de la empresa (2025) */
export const SS_RATES_2025 = {
  contingencias_comunes: 23.60,
  mei: 0.67,
  desempleo_indefinido: 5.50,
  desempleo_temporal: 6.70,
  fogasa: 0.20,
  formacion_profesional: 0.60,
} as const;

/** Total SS empresa por tipo de contrato */
export const SS_TOTAL_BY_CONTRACT = {
  indefinido: 30.57,
  temporal: 31.77,
  autonomo: 0,
} as const;

export type ContractType = keyof typeof SS_TOTAL_BY_CONTRACT;

/** Base maxima de cotizacion mensual 2025 */
export const BASE_MAXIMA_MENSUAL = 4909.50;

/** Base maxima semanal derivada */
export const BASE_MAXIMA_SEMANAL = BASE_MAXIMA_MENSUAL / 30 * 7; // ~1145.55

/** Base maxima diaria derivada */
export const BASE_MAXIMA_DIARIA = BASE_MAXIMA_MENSUAL / 30; // ~163.65

/** IRPF retenciones por defecto */
export const IRPF_DEFAULTS = {
  artistas: 2,   // RD 31/2023 — relacion laboral especial artistas
  general: 15,   // Minimo legal rendimientos del trabajo
} as const;

/** SS% por defecto segun capitulo */
export const SS_DEFAULTS_BY_CHAPTER: Record<number, number> = {
  2: SS_TOTAL_BY_CONTRACT.indefinido,
  3: SS_TOTAL_BY_CONTRACT.indefinido,
};

/** IRPF% por defecto segun capitulo */
export const IRPF_DEFAULTS_BY_CHAPTER: Record<number, number> = {
  2: IRPF_DEFAULTS.artistas,
  3: IRPF_DEFAULTS.general,
};

/** Capitulos de personal que soportan SS/IRPF */
export const PERSONNEL_CHAPTERS = [2, 3] as const;

/** Tipos de unidad para partidas presupuestarias */
export const UNIT_TYPES = {
  TA: 'T/A',
  SEM: 'Semanas',
  JORNADAS: 'Jornadas',
} as const;

export type UnitType = keyof typeof UNIT_TYPES;

/** Estructura oficial ICAA 12 capitulos */
export const ICAA_CHAPTERS = [
  { id: 1, name: 'CAP. 01 - Guión y Música' },
  { id: 2, name: 'CAP. 02 - Personal Artístico' },
  { id: 3, name: 'CAP. 03 - Equipo Técnico' },
  { id: 4, name: 'CAP. 04 - Escenografía' },
  { id: 5, name: 'CAP. 05 - Estudios Rodaje/Sonorización y Varios Producción' },
  { id: 6, name: 'CAP. 06 - Maquinaria, Rodaje y Transportes' },
  { id: 7, name: 'CAP. 07 - Viajes, Hoteles y Comidas' },
  { id: 8, name: 'CAP. 08 - Película Virgen' },
  { id: 9, name: 'CAP. 09 - Laboratorio' },
  { id: 10, name: 'CAP. 10 - Seguros' },
  { id: 11, name: 'CAP. 11 - Gastos Generales' },
  { id: 12, name: 'CAP. 12 - Gastos Explotación, Comercio y Financiación' },
] as const;
