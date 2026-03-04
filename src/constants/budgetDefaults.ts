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

// =============================================================================
// Defaults de planificacion de equipo por fases PRE/ROD/POST
// Semanas de referencia para un rodaje de 6 semanas (~30 dias)
// =============================================================================

export interface CrewPhaseDefaults {
  unitType: UnitType;
  /** Semanas pre-produccion (base 6 sem rodaje) */
  preWeeks: number;
  /** Semanas rodaje (base 6 sem rodaje) */
  rodWeeks: number;
  /** Semanas post-produccion (base 6 sem rodaje) */
  postWeeks: number;
  contractType: ContractType;
}

/** Semanas de rodaje de referencia para los defaults */
export const REFERENCE_SHOOTING_WEEKS = 6;

/**
 * Defaults de fase por rol. Las claves son keywords normalizadas (minusculas,
 * sin tildes ni barras). Se buscan por fuzzy match contra el concepto.
 */
export const CREW_PHASE_DEFAULTS: Record<string, CrewPhaseDefaults> = {
  // --- Cap 02: Personal Artistico ---
  'protagonista': { unitType: 'TA', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'indefinido' },
  'principal': { unitType: 'TA', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'indefinido' },
  'secundario': { unitType: 'TA', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'indefinido' },
  'figuracion': { unitType: 'JORNADAS', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'temporal' },
  'doblador': { unitType: 'JORNADAS', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'temporal' },

  // --- Cap 03: Direccion ---
  'director realizador': { unitType: 'TA', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'indefinido' },
  'productor ejecutivo': { unitType: 'TA', preWeeks: 0, rodWeeks: 0, postWeeks: 0, contractType: 'indefinido' },
  'director produccion': { unitType: 'SEM', preWeeks: 6, rodWeeks: 6, postWeeks: 4, contractType: 'indefinido' },
  'jefe produccion': { unitType: 'SEM', preWeeks: 4, rodWeeks: 6, postWeeks: 2, contractType: 'indefinido' },
  'ayudante produccion': { unitType: 'SEM', preWeeks: 2, rodWeeks: 6, postWeeks: 1, contractType: 'indefinido' },
  'primer ayudante direccion': { unitType: 'SEM', preWeeks: 6, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'segundo ayudante direccion': { unitType: 'SEM', preWeeks: 2, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'script': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'continuidad': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Fotografia ---
  'director fotografia': { unitType: 'SEM', preWeeks: 2, rodWeeks: 6, postWeeks: 1, contractType: 'indefinido' },
  'operador camara': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'primer ayudante camara': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'segundo ayudante camara': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'foto fija': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Arte y Decoracion ---
  'director arte': { unitType: 'SEM', preWeeks: 6, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'decorador': { unitType: 'SEM', preWeeks: 4, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'attrezzista': { unitType: 'SEM', preWeeks: 2, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Vestuario ---
  'figurinista': { unitType: 'SEM', preWeeks: 4, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'vestuario': { unitType: 'SEM', preWeeks: 4, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'ayudante vestuario': { unitType: 'SEM', preWeeks: 2, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Maquillaje y Peluqueria ---
  'jefe maquillaje': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'maquillaje': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'jefe peluqueria': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'peluqueria': { unitType: 'SEM', preWeeks: 1, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Sonido ---
  'jefe sonido': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'microfonista': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Electricos y Maquinistas ---
  'jefe electricos': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'electrico': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },
  'maquinista': { unitType: 'SEM', preWeeks: 0, rodWeeks: 6, postWeeks: 0, contractType: 'indefinido' },

  // --- Cap 03: Montaje y Postproduccion ---
  'montador': { unitType: 'SEM', preWeeks: 0, rodWeeks: 0, postWeeks: 12, contractType: 'indefinido' },
  'ayudante montaje': { unitType: 'SEM', preWeeks: 0, rodWeeks: 0, postWeeks: 8, contractType: 'indefinido' },
  'coordinador postproduccion': { unitType: 'SEM', preWeeks: 0, rodWeeks: 0, postWeeks: 10, contractType: 'indefinido' },
};

/** Normaliza texto: minusculas, sin tildes, sin barras, sin puntuacion */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\\().,;:'"!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca defaults de fase para un concepto dado.
 * Usa fuzzy match: la clave con mas palabras coincidentes gana.
 */
export function getCrewPhaseDefaults(concept: string, _chapter: number): CrewPhaseDefaults | null {
  const norm = normalize(concept);

  let bestMatch: CrewPhaseDefaults | null = null;
  let bestScore = 0;

  for (const [key, defaults] of Object.entries(CREW_PHASE_DEFAULTS)) {
    const keyWords = key.split(' ');
    const allMatch = keyWords.every(w => norm.includes(w));
    if (allMatch && keyWords.length > bestScore) {
      bestMatch = defaults;
      bestScore = keyWords.length;
    }
  }

  return bestMatch;
}

/**
 * Escala semanas de referencia (base 6 sem rodaje) al rodaje real.
 * rodWeeks = duracion real; PRE y POST escalan proporcionalmente.
 */
export function scaleWeeksToProject(
  defaults: CrewPhaseDefaults,
  actualShootingWeeks: number,
): { preWeeks: number; rodWeeks: number; postWeeks: number } {
  if (defaults.unitType === 'TA') {
    return { preWeeks: 0, rodWeeks: 0, postWeeks: 0 };
  }
  const factor = actualShootingWeeks / REFERENCE_SHOOTING_WEEKS;
  return {
    preWeeks: Math.round(defaults.preWeeks * factor),
    rodWeeks: actualShootingWeeks,
    postWeeks: Math.round(defaults.postWeeks * factor),
  };
}
