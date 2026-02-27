/**
 * Tarifas ICAA 2025 — Datos extraidos de:
 * - Convenio Colectivo de Tecnicos (Agosto 2025, incremento 2.2%)
 * - Facturas reales de proveedores (Antaviana, El Colorado, By Jarana Films)
 * - Presupuestos ICAA reales (ED, GOL, LMDS, Okasan)
 */

// ── Tipos ─────────────────────────────────────────────────────────────

export type CategoriaPresupuesto = 'bajo_presupuesto' | 'presupuesto_estandar';
export type TipoProyecto = 'cortometraje' | 'largometraje';
export type NivelPresupuesto = 'bajo' | 'medio' | 'alto';

export interface TarifaSemanal {
  bajo_presupuesto: number; // EUR/semana — cine <=1.125.000 EUR
  presupuesto_estandar: number; // EUR/semana — cine >1.125.000 EUR
}

// ── Tarifas semanales equipo tecnico (Convenio Colectivo Ago 2025) ───

export const TARIFAS_EQUIPO_TECNICO: Record<string, TarifaSemanal & { codigo_icaa: string; nombre: string }> = {
  // Cap 03.01 - Direccion
  director_realizador:        { codigo_icaa: '03.01.01', nombre: 'Director/Realizador',        bajo_presupuesto: 4713, presupuesto_estandar: 5890 },
  primer_ayudante_direccion:  { codigo_icaa: '03.01.02', nombre: '1er Ayudante Direccion',     bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  segundo_ayudante_direccion: { codigo_icaa: '03.01.03', nombre: '2o Ayudante Direccion',      bajo_presupuesto: 1977, presupuesto_estandar: 2472 },
  script:                     { codigo_icaa: '03.01.04', nombre: 'Script / Continuidad',       bajo_presupuesto: 2197, presupuesto_estandar: 2747 },

  // Cap 03.02 - Produccion
  director_produccion:        { codigo_icaa: '03.02.01', nombre: 'Director de Produccion',     bajo_presupuesto: 3954, presupuesto_estandar: 4882 },
  jefe_produccion:            { codigo_icaa: '03.02.02', nombre: 'Jefe de Produccion',         bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  ayudante_produccion:        { codigo_icaa: '03.02.03', nombre: 'Ayudante de Produccion',     bajo_presupuesto: 1977, presupuesto_estandar: 2472 },
  auxiliar_produccion:        { codigo_icaa: '03.02.04', nombre: 'Auxiliar de Produccion',      bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
  secretaria_produccion:      { codigo_icaa: '03.02.05', nombre: 'Secretaria de Produccion',   bajo_presupuesto: 1717, presupuesto_estandar: 2079 },

  // Cap 03.03 - Fotografia
  director_fotografia:        { codigo_icaa: '03.03.01', nombre: 'Director de Fotografia',     bajo_presupuesto: 3954, presupuesto_estandar: 4882 },
  camarografo:                { codigo_icaa: '03.03.02', nombre: 'Operador de Camara',         bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  primer_ayudante_camara:     { codigo_icaa: '03.03.03', nombre: '1er Ayudante Camara',        bajo_presupuesto: 1977, presupuesto_estandar: 2472 },
  segundo_ayudante_camara:    { codigo_icaa: '03.03.04', nombre: '2o Ayudante Camara',         bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
  foquista:                   { codigo_icaa: '03.03.05', nombre: 'Foquista',                   bajo_presupuesto: 2197, presupuesto_estandar: 2747 },
  foto_fija:                  { codigo_icaa: '03.03.06', nombre: 'Foto Fija',                  bajo_presupuesto: 1717, presupuesto_estandar: 2079 },

  // Cap 03.04 - Decoracion
  director_arte:              { codigo_icaa: '03.04.01', nombre: 'Director de Arte',           bajo_presupuesto: 3954, presupuesto_estandar: 4882 },
  decorador:                  { codigo_icaa: '03.04.02', nombre: 'Decorador',                  bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  ayudante_decoracion:        { codigo_icaa: '03.04.03', nombre: 'Ayudante Decoracion',        bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
  attrezzista:                { codigo_icaa: '03.04.04', nombre: 'Attrezzista',                bajo_presupuesto: 1977, presupuesto_estandar: 2472 },

  // Cap 03.05 - Vestuario
  figurinista:                { codigo_icaa: '03.05.01', nombre: 'Figurinista',                bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  ayudante_vestuario:         { codigo_icaa: '03.05.02', nombre: 'Ayudante Vestuario',         bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
  sastra:                     { codigo_icaa: '03.05.03', nombre: 'Sastra',                     bajo_presupuesto: 1717, presupuesto_estandar: 2079 },

  // Cap 03.06 - Maquillaje
  jefe_maquillaje:            { codigo_icaa: '03.06.01', nombre: 'Jefe de Maquillaje',         bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  ayudante_maquillaje:        { codigo_icaa: '03.06.02', nombre: 'Ayudante Maquillaje',        bajo_presupuesto: 1717, presupuesto_estandar: 2079 },

  // Cap 03.07 - Peluqueria
  jefe_peluqueria:            { codigo_icaa: '03.07.01', nombre: 'Jefe de Peluqueria',         bajo_presupuesto: 2197, presupuesto_estandar: 2747 },
  ayudante_peluqueria:        { codigo_icaa: '03.07.02', nombre: 'Ayudante Peluqueria',        bajo_presupuesto: 1717, presupuesto_estandar: 2079 },

  // Cap 03.08 - Efectos especiales mecanicos
  jefe_efectos_especiales:    { codigo_icaa: '03.08.01', nombre: 'Jefe EFX Mecanicos',         bajo_presupuesto: 2636, presupuesto_estandar: 3356 },

  // Cap 03.09 - Sonido
  jefe_sonido:                { codigo_icaa: '03.09.01', nombre: 'Jefe de Sonido',             bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  microfonista:               { codigo_icaa: '03.09.02', nombre: 'Microfonista',               bajo_presupuesto: 1977, presupuesto_estandar: 2472 },

  // Cap 03.10 - Montaje
  montador:                   { codigo_icaa: '03.10.01', nombre: 'Montador',                   bajo_presupuesto: 2636, presupuesto_estandar: 3356 },
  ayudante_montaje:           { codigo_icaa: '03.10.02', nombre: 'Ayudante Montaje',           bajo_presupuesto: 1977, presupuesto_estandar: 2472 },

  // Cap 03.11 - Electricos y Maquinistas
  jefe_electricos:            { codigo_icaa: '03.11.01', nombre: 'Jefe de Electricos',         bajo_presupuesto: 2197, presupuesto_estandar: 2747 },
  electrico:                  { codigo_icaa: '03.11.02', nombre: 'Electrico',                  bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
  maquinista:                 { codigo_icaa: '03.11.03', nombre: 'Maquinista Jefe',            bajo_presupuesto: 1977, presupuesto_estandar: 2472 },
  ayudante_maquinista:        { codigo_icaa: '03.11.04', nombre: 'Ayudante Maquinista',        bajo_presupuesto: 1717, presupuesto_estandar: 2079 },
};

// ── Tarifas guionistas ───────────────────────────────────────────────

export const TARIFAS_GUIONISTA = {
  alto:  { minimo: 30000, maximo: 60000 },
  medio: { minimo: 15000, maximo: 30000 },
  bajo:  { minimo: 5000,  maximo: 15000 },
};

// ── Tarifas personal artistico (dia de rodaje) ──────────────────────

export const TARIFAS_ACTORES = {
  protagonista:  { bajo: 1500, medio: 2500, alto: 4000 },
  principal:     { bajo: 800,  medio: 1500, alto: 2500 },
  secundario:    { bajo: 400,  medio: 800,  alto: 1500 },
  figuracion:    { bajo: 80,   medio: 120,  alto: 200  },
};

// ── Tarifas equipamiento (EUR/dia, datos facturas reales) ───────────

export const TARIFAS_EQUIPAMIENTO = {
  camara: {
    arri_alexa_mini:  { dia: 450, semana: 2250 },
    red_v_raptor:     { dia: 400, semana: 2000 },
    sony_venice:      { dia: 380, semana: 1900 },
    blackmagic_ursa:  { dia: 120, semana: 600  },
  },
  optica: {
    primos_master:    { dia: 300, semana: 1500 },
    primos_medio:     { dia: 150, semana: 750  },
    zoom_cine:        { dia: 100, semana: 500  },
  },
  iluminacion: {
    kit_basico:       { dia: 80,  semana: 400  },
    kit_medio:        { dia: 200, semana: 1000 },
    kit_avanzado:     { dia: 450, semana: 2250 },
  },
  sonido: {
    kit_directo:      { dia: 150, semana: 750  },
    microfonos_extra: { dia: 50,  semana: 250  },
  },
  grip: {
    dolly_track:      { dia: 120, semana: 600  },
    grua_pequena:     { dia: 200, semana: 1000 },
    steadicam:        { dia: 300, semana: 1500 },
    drone_con_piloto: { dia: 600, semana: 3000 },
  },
};

// ── Tarifas postproduccion (datos Antaviana + El Colorado) ──────────

export const TARIFAS_POSTPRODUCCION = {
  etalonaje: {
    cortometraje: { minimo: 2000, maximo: 5000  },
    largometraje: { minimo: 10000, maximo: 25000 }, // 1.600/dia x 10 dias HDR
  },
  sonido: {
    diseno_sonoro:  { cortometraje: 2000,  largometraje: 21450 }, // 715/dia x 30 dias
    edicion_dialog: { cortometraje: 1500,  largometraje: 17000 }, // 680/dia x 25 dias
    foley:          { cortometraje: 1000,  largometraje: 10000 },
    mezcla_5_1:     { cortometraje: 3000,  largometraje: 12000 },
  },
  vfx: {
    plano_simple:   { minimo: 300,  maximo: 800  },
    plano_medio:    { minimo: 800,  maximo: 2500 },
    plano_complejo: { minimo: 2500, maximo: 8000 },
    paquete_moderado_largo: 200000, // dato real factura Antaviana
  },
  grafismo: {
    titulos_creditos: { cortometraje: 800, largometraje: 4600 },
  },
  mastering: {
    dcp_2k:          1500,
    dcp_4k:          2250,
    dcdm_tiff:       500,
    master_uhd_709:  800,
    imf_netflix:     1800,
  },
  subtitulos: {
    por_minuto_transcripcion: 4.80,
    por_minuto_traduccion:    10.80,
    por_minuto_accesibilidad: 22.00,
  },
  coordinacion_postpro: {
    cortometraje: 1500,
    largometraje: 9000, // 6 meses
  },
};

// ── Constantes fiscales y costes sociales ───────────────────────────

export const COSTES_SOCIALES = {
  seguridad_social_empresa: 0.235,  // 23.5%
  irpf_general:             0.15,   // 15%
  irpf_alto:                0.19,   // 19% (>60K/anual)
};

export const DIETAS = {
  media_dieta:     15,   // EUR
  dieta_completa:  55,   // EUR
  km_coche:        0.26, // EUR/km
};

export const SEGUROS = {
  responsabilidad_civil: 0.003,  // % del presupuesto produccion
  accidentes:            0.002,
  interrupcion_rodaje:   0.005,
  equipo_material:       0.008,
};

export const PORCENTAJES = {
  gastos_generales: 0.05,   // 5% del presupuesto produccion
  imprevistos:      0.10,   // 10%
};

// ── Rangos tipicos por tipo de proyecto ──────────────────────────────

export const RANGOS_PROYECTO = {
  cortometraje: {
    diasRodaje:   { min: 3, tipico: 5, max: 12 },
    presupuesto:  { min: 15000, tipico: 60000, max: 150000 },
    equipoMinimo: ['director_realizador', 'director_produccion', 'director_fotografia',
                   'jefe_sonido', 'jefe_maquillaje', 'montador', 'jefe_electricos'],
  },
  largometraje: {
    diasRodaje:   { min: 20, tipico: 30, max: 50 },
    presupuesto:  { min: 300000, tipico: 1500000, max: 5000000 },
    equipoMinimo: ['director_realizador', 'primer_ayudante_direccion', 'segundo_ayudante_direccion',
                   'script', 'director_produccion', 'jefe_produccion', 'ayudante_produccion',
                   'auxiliar_produccion', 'director_fotografia', 'camarografo',
                   'primer_ayudante_camara', 'foquista', 'director_arte', 'decorador',
                   'attrezzista', 'figurinista', 'jefe_maquillaje', 'jefe_peluqueria',
                   'jefe_sonido', 'microfonista', 'montador', 'ayudante_montaje',
                   'jefe_electricos', 'electrico', 'maquinista'],
  },
};

// ── Auditoria ────────────────────────────────────────────────────────

export const TARIFAS_AUDITORIA = {
  cortometraje: 1000,
  largometraje: 3600,
};
