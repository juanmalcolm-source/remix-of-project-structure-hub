// Factores de complejidad para escenas - 15 factores
export interface ComplejidadFactores {
  movimiento_camara: boolean;
  accion_fisica: boolean;
  stunts: boolean;
  efectos_especiales: boolean;
  ninos: boolean;
  animales: boolean;
  vehiculos_movimiento: boolean;
  iluminacion_compleja: boolean;
  escena_noche: boolean;
  exteriores_clima: boolean;
  dialogo_extenso: boolean;
  requiere_grua: boolean;
  planos_especiales: boolean;
  num_personajes: number;
  num_extras: number;
}

export const FACTORES_LABELS: Record<keyof ComplejidadFactores, string> = {
  movimiento_camara: 'Movimiento de cámara',
  accion_fisica: 'Acción física',
  stunts: 'Stunts / Especialistas',
  efectos_especiales: 'Efectos especiales',
  ninos: 'Niños',
  animales: 'Animales',
  vehiculos_movimiento: 'Vehículos en movimiento',
  iluminacion_compleja: 'Iluminación compleja',
  escena_noche: 'Escena nocturna',
  exteriores_clima: 'Exteriores (clima)',
  dialogo_extenso: 'Diálogo extenso',
  requiere_grua: 'Requiere grúa',
  planos_especiales: 'Planos especiales (dron, steadicam)',
  num_personajes: 'Nº personajes',
  num_extras: 'Nº extras',
};

// Pesos para el cálculo del tiempo extra (minutos)
export const PESOS_TIEMPO: Record<string, number> = {
  movimiento_camara: 15,
  accion_fisica: 20,
  stunts: 40,
  efectos_especiales: 30,
  ninos: 15,
  animales: 25,
  vehiculos_movimiento: 30,
  iluminacion_compleja: 20,
  escena_noche: 10,
  exteriores_clima: 8,
  dialogo_extenso: 10,
  requiere_grua: 20,
  planos_especiales: 15,
  // num_personajes > 2: +5min/personaje extra
  // num_extras: +5min por cada 5 extras
};

export function crearFactoresVacios(): ComplejidadFactores {
  return {
    movimiento_camara: false,
    accion_fisica: false,
    stunts: false,
    efectos_especiales: false,
    ninos: false,
    animales: false,
    vehiculos_movimiento: false,
    iluminacion_compleja: false,
    escena_noche: false,
    exteriores_clima: false,
    dialogo_extenso: false,
    requiere_grua: false,
    planos_especiales: false,
    num_personajes: 0,
    num_extras: 0,
  };
}

export function calcularScoreComplejidad(factores: ComplejidadFactores): number {
  let score = 0;

  const boolKeys: (keyof ComplejidadFactores)[] = [
    'movimiento_camara', 'accion_fisica', 'stunts', 'efectos_especiales',
    'ninos', 'animales', 'vehiculos_movimiento', 'iluminacion_compleja',
    'escena_noche', 'exteriores_clima', 'dialogo_extenso', 'requiere_grua',
    'planos_especiales',
  ];

  const pesos: Record<string, number> = {
    movimiento_camara: 4,
    accion_fisica: 6,
    stunts: 12,
    efectos_especiales: 8,
    ninos: 5,
    animales: 5,
    vehiculos_movimiento: 8,
    iluminacion_compleja: 4,
    escena_noche: 3,
    exteriores_clima: 3,
    dialogo_extenso: 2,
    requiere_grua: 5,
    planos_especiales: 4,
  };

  for (const key of boolKeys) {
    if (factores[key]) {
      score += pesos[key] ?? 0;
    }
  }

  // +2 puntos por personaje a partir del 3ro
  if (factores.num_personajes > 2) {
    score += (factores.num_personajes - 2) * 2;
  }

  // +1 punto por cada 5 extras
  score += Math.floor(factores.num_extras / 5);

  return Math.min(score, 100);
}

export type CategoriaComplejidad = 'baja' | 'media' | 'alta' | 'extrema';

export function obtenerCategoria(score: number): CategoriaComplejidad {
  if (score < 10) return 'baja';
  if (score < 25) return 'media';
  if (score < 50) return 'alta';
  return 'extrema';
}

export function colorCategoria(cat: CategoriaComplejidad): string {
  switch (cat) {
    case 'baja': return 'bg-green-100 text-green-800 border-green-200';
    case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'extrema': return 'bg-red-100 text-red-800 border-red-200';
  }
}

export function calcularTiempoExtraMinutos(factores: ComplejidadFactores): number {
  let extra = 0;

  if (factores.movimiento_camara) extra += 15;
  if (factores.accion_fisica) extra += 20;
  if (factores.stunts) extra += 40;
  if (factores.efectos_especiales) extra += 30;
  if (factores.ninos) extra += 15;
  if (factores.animales) extra += 25;
  if (factores.vehiculos_movimiento) extra += 30;
  if (factores.iluminacion_compleja) extra += 20;
  if (factores.escena_noche) extra += 10;
  if (factores.exteriores_clima) extra += 8;
  if (factores.dialogo_extenso) extra += 10;
  if (factores.requiere_grua) extra += 20;
  if (factores.planos_especiales) extra += 15;

  if (factores.num_personajes > 2) {
    extra += (factores.num_personajes - 2) * 5;
  }
  extra += Math.floor(factores.num_extras / 5) * 5;

  return extra;
}
