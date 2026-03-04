// =============================================================================
// Calculadora SS e IRPF — Funciones puras
// Implementa topes de cotizacion segun base maxima 2025
// =============================================================================

import {
  BASE_MAXIMA_MENSUAL,
  BASE_MAXIMA_SEMANAL,
  BASE_MAXIMA_DIARIA,
  SS_TOTAL_BY_CONTRACT,
  IRPF_DEFAULTS,
  SS_DEFAULTS_BY_CHAPTER,
  IRPF_DEFAULTS_BY_CHAPTER,
  type ContractType,
  type UnitType,
} from '@/constants/budgetDefaults';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface SSCalculationInput {
  /** Remuneracion bruta total */
  grossRemuneration: number;
  /** Porcentaje SS empresa */
  ssPercentage: number;
  /** Tipo de unidad (T/A, Semanas, Jornadas) */
  unitType: UnitType;
  /** Precio por unidad (tarifa semanal, diaria, o importe alzado) */
  unitPrice: number;
  /** Numero total de periodos (semanas, jornadas, o 1 para T/A) */
  totalPeriods: number;
}

export interface SSCalculationResult {
  /** Coste SS final (con tope aplicado si corresponde) */
  ssCost: number;
  /** Si se aplico tope de base maxima */
  capApplied: boolean;
}

// ---------------------------------------------------------------------------
// Calculo remuneracion bruta
// ---------------------------------------------------------------------------

/**
 * Calcula la remuneracion bruta segun tipo de unidad.
 *
 * - T/A: unitPrice es el importe total alzado → bruto = unitPrice
 * - SEM: unitPrice * totalPeriods (semanas)
 * - JORNADAS: unitPrice * totalPeriods (jornadas)
 *
 * Para Cap 02 con units/quantity: bruto = units * quantity * unitPrice
 */
export function calculateRemuneration(
  unitType: UnitType,
  unitPrice: number,
  totalPeriods: number,
): number {
  if (unitType === 'TA') {
    return unitPrice; // Tanto alzado: el precio ES el total
  }
  return unitPrice * totalPeriods;
}

// ---------------------------------------------------------------------------
// Calculo SS con topes
// ---------------------------------------------------------------------------

/**
 * Calcula el coste de Seguridad Social a cargo de la empresa,
 * aplicando el tope de base maxima de cotizacion segun el tipo de unidad.
 *
 * Logica de tope:
 * - T/A (Tanto Alzado):
 *   Se estima meses equivalentes = bruto / base_maxima_mensual (min 1).
 *   Tope = base_maxima_mensual * meses_equiv * SS%
 *   Resultado = min(bruto * SS%, tope)
 *
 * - SEM (Semanas):
 *   Si tarifa_semanal <= base_maxima_semanal → sin tope
 *   Si tarifa_semanal > base_maxima_semanal → tope = base_maxima_semanal * semanas * SS%
 *
 * - JORNADAS:
 *   Si tarifa_diaria <= base_maxima_diaria → sin tope
 *   Si tarifa_diaria > base_maxima_diaria → tope = base_maxima_diaria * jornadas * SS%
 */
export function calculateSSCost(input: SSCalculationInput): SSCalculationResult {
  const { grossRemuneration, ssPercentage, unitType, unitPrice, totalPeriods } = input;

  if (grossRemuneration <= 0 || ssPercentage <= 0) {
    return { ssCost: 0, capApplied: false };
  }

  const rate = ssPercentage / 100;
  const uncappedCost = grossRemuneration * rate;

  switch (unitType) {
    case 'TA': {
      // Tanto alzado: estimar meses equivalentes para el tope
      const mesesEquiv = Math.max(1, Math.ceil(grossRemuneration / BASE_MAXIMA_MENSUAL));
      const cappedCost = BASE_MAXIMA_MENSUAL * mesesEquiv * rate;
      if (uncappedCost <= cappedCost) {
        return { ssCost: round2(uncappedCost), capApplied: false };
      }
      return { ssCost: round2(cappedCost), capApplied: true };
    }

    case 'SEM': {
      // Semanas: comparar tarifa semanal con base maxima semanal
      if (unitPrice <= BASE_MAXIMA_SEMANAL) {
        return { ssCost: round2(uncappedCost), capApplied: false };
      }
      const cappedCost = BASE_MAXIMA_SEMANAL * totalPeriods * rate;
      return { ssCost: round2(cappedCost), capApplied: true };
    }

    case 'JORNADAS': {
      // Jornadas: comparar tarifa diaria con base maxima diaria
      if (unitPrice <= BASE_MAXIMA_DIARIA) {
        return { ssCost: round2(uncappedCost), capApplied: false };
      }
      const cappedCost = BASE_MAXIMA_DIARIA * totalPeriods * rate;
      return { ssCost: round2(cappedCost), capApplied: true };
    }

    default:
      return { ssCost: round2(uncappedCost), capApplied: false };
  }
}

// ---------------------------------------------------------------------------
// Calculo IRPF
// ---------------------------------------------------------------------------

/**
 * Calcula la retencion IRPF. No tiene tope — es porcentaje directo sobre bruto.
 */
export function calculateIRPFCost(
  grossRemuneration: number,
  irpfPercentage: number,
): number {
  if (grossRemuneration <= 0 || irpfPercentage <= 0) return 0;
  return round2(grossRemuneration * (irpfPercentage / 100));
}

// ---------------------------------------------------------------------------
// Defaults por capitulo
// ---------------------------------------------------------------------------

/**
 * Devuelve el % SS por defecto segun capitulo y tipo de contrato.
 * Cap 02/03 → SS segun contrato (30.57% indefinido, 31.77% temporal)
 * Otros → 0
 */
export function getDefaultSSRate(
  chapter: number,
  contractType: ContractType = 'indefinido',
): number {
  if (chapter === 2 || chapter === 3) {
    return SS_TOTAL_BY_CONTRACT[contractType];
  }
  return 0;
}

/**
 * Devuelve el % IRPF por defecto segun capitulo.
 * Cap 02 → 2% (artistas, RD 31/2023)
 * Cap 03 → 15% (minimo legal rendimientos trabajo)
 * Otros → 0
 */
export function getDefaultIRPFRate(chapter: number): number {
  return IRPF_DEFAULTS_BY_CHAPTER[chapter] ?? 0;
}

/**
 * Devuelve el tipo de unidad por defecto segun capitulo.
 * Cap 02 → T/A (actores suelen cobrar tanto alzado)
 * Cap 03 → SEM (tecnicos suelen cobrar por semana)
 */
export function getDefaultUnitType(chapter: number): UnitType {
  if (chapter === 2) return 'TA';
  if (chapter === 3) return 'SEM';
  return 'TA';
}

/**
 * Devuelve el tipo de contrato por defecto.
 */
export function getDefaultContractType(): ContractType {
  return 'indefinido';
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Redondea a 2 decimales */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcula el total de periodos para Cap 03 con fases PRE/ROD/POST.
 * Para T/A siempre devuelve 1.
 */
export function calculateTotalPeriods(
  unitType: UnitType,
  preWeeks: number,
  rodWeeks: number,
  postWeeks: number,
): number {
  if (unitType === 'TA') return 1;
  return (preWeeks || 0) + (rodWeeks || 0) + (postWeeks || 0);
}

/**
 * Recalcula todos los costes de una linea de personal.
 * Devuelve los valores calculados sin mutar el input.
 */
export function recalculatePersonnelCosts(params: {
  unitType: UnitType;
  unitPrice: number;
  units: number;
  quantity: number;
  agencyPercentage: number;
  ssPercentage: number;
  irpfPercentage: number;
  preWeeks: number;
  rodWeeks: number;
  postWeeks: number;
  chapter: number;
}) {
  const {
    unitType, unitPrice, units, quantity, agencyPercentage,
    ssPercentage, irpfPercentage,
    preWeeks, rodWeeks, postWeeks, chapter,
  } = params;

  // Determinar periodos y remuneracion
  let totalPeriods: number;
  let grossRemuneration: number;
  let effectiveUnits: number;
  let effectiveQuantity: number;

  if (chapter === 3 && unitType !== 'TA') {
    // Cap 03 con semanas/jornadas: periodos = PRE+ROD+POST
    totalPeriods = calculateTotalPeriods(unitType, preWeeks, rodWeeks, postWeeks);
    grossRemuneration = unitPrice * totalPeriods;
    // Sincronizar units/quantity para la columna GENERATED de la DB
    effectiveUnits = 1;
    effectiveQuantity = totalPeriods;
  } else if (unitType === 'TA') {
    // Tanto alzado: el unitPrice es el total
    totalPeriods = 1;
    grossRemuneration = unitPrice;
    effectiveUnits = 1;
    effectiveQuantity = 1;
  } else {
    // Cap 02 u otros con semanas/jornadas
    totalPeriods = units * quantity;
    grossRemuneration = unitPrice * totalPeriods;
    effectiveUnits = units;
    effectiveQuantity = quantity;
  }

  // Remuneracion con agencia
  const remunerationWithAgency = grossRemuneration * (1 + (agencyPercentage || 0) / 100);

  // SS con tope
  const ssResult = calculateSSCost({
    grossRemuneration: remunerationWithAgency,
    ssPercentage,
    unitType,
    unitPrice: unitType === 'TA' ? remunerationWithAgency : unitPrice * (1 + (agencyPercentage || 0) / 100),
    totalPeriods,
  });

  // IRPF sin tope
  const irpfCost = calculateIRPFCost(remunerationWithAgency, irpfPercentage);

  return {
    grossRemuneration: round2(remunerationWithAgency),
    ssCost: ssResult.ssCost,
    ssCapApplied: ssResult.capApplied,
    irpfCost,
    totalPeriods,
    effectiveUnits,
    effectiveQuantity,
  };
}
