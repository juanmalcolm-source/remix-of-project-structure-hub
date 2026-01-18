/**
 * Base de Datos de Tarifas del Sector Audiovisual Español 2025
 * Fuentes: Presupuestos reales (El Desvío, La Muerte de Séneca), Mercado español 2025
 */

export interface TarifaSalarial {
  codigo_icaa: string;
  concepto: string;
  categoria: string;
  tarifa_min: number;
  tarifa_media: number;
  tarifa_max: number;
  unidad: 'día' | 'semana' | 'película' | 'minuto' | 'plano' | 'secuencia';
  agencia_pct: number;
  seguros_sociales_pct: number;
  fuente: string;
  fecha_actualizacion: string;
  notas?: string;
}

export interface TarifaEquipamiento {
  codigo_icaa: string;
  concepto: string;
  categoria: string;
  tarifa_min: number;
  tarifa_media: number;
  tarifa_max: number;
  unidad: 'día' | 'semana' | 'película' | 'plano' | 'secuencia';
  fuente: string;
  fecha_actualizacion: string;
  notas?: string;
}

// ============================================
// CAPÍTULO 01: DESARROLLO Y GUIÓN
// ============================================
export const TARIFAS_DESARROLLO: TarifaSalarial[] = [
  {
    codigo_icaa: "01.01.01",
    concepto: "Derechos obra original",
    categoria: "Derechos",
    tarifa_min: 2000,
    tarifa_media: 5000,
    tarifa_max: 15000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "01.01.02",
    concepto: "Guión original",
    categoria: "Guión",
    tarifa_min: 8000,
    tarifa_media: 15000,
    tarifa_max: 40000,
    unidad: "película",
    agencia_pct: 10,
    seguros_sociales_pct: 0,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "01.02.01",
    concepto: "Música original",
    categoria: "Música",
    tarifa_min: 5000,
    tarifa_media: 12000,
    tarifa_max: 30000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "01.02.02",
    concepto: "Derechos musicales sincronización",
    categoria: "Derechos",
    tarifa_min: 1000,
    tarifa_media: 3000,
    tarifa_max: 10000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 02: PERSONAL ARTÍSTICO
// ============================================
export const TARIFAS_ARTISTICO: TarifaSalarial[] = [
  {
    codigo_icaa: "02.01.01",
    concepto: "Protagonista",
    categoria: "Actor Principal",
    tarifa_min: 5000,
    tarifa_media: 15000,
    tarifa_max: 50000,
    unidad: "película",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18",
    notas: "Varía enormemente según nombre"
  },
  {
    codigo_icaa: "02.01.02",
    concepto: "Actor Principal",
    categoria: "Actor Principal",
    tarifa_min: 3000,
    tarifa_media: 8000,
    tarifa_max: 25000,
    unidad: "película",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "02.01.03",
    concepto: "Actor Secundario",
    categoria: "Actor Secundario",
    tarifa_min: 150,
    tarifa_media: 300,
    tarifa_max: 800,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "02.01.04",
    concepto: "Figuración",
    categoria: "Figuración",
    tarifa_min: 60,
    tarifa_media: 80,
    tarifa_max: 120,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "02.02.01",
    concepto: "Director Casting",
    categoria: "Casting",
    tarifa_min: 3000,
    tarifa_media: 5000,
    tarifa_max: 10000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "02.03.01",
    concepto: "Doblador",
    categoria: "Doblaje",
    tarifa_min: 200,
    tarifa_media: 350,
    tarifa_max: 600,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Estándar mercado español",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 03: EQUIPO TÉCNICO
// ============================================
export const TARIFAS_TECNICO: TarifaSalarial[] = [
  // Fotografía
  {
    codigo_icaa: "03.01.01",
    concepto: "Director de Fotografía",
    categoria: "Jefe Departamento",
    tarifa_min: 400,
    tarifa_media: 600,
    tarifa_max: 1200,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "03.01.02",
    concepto: "Operador de Cámara",
    categoria: "Técnico Senior",
    tarifa_min: 300,
    tarifa_media: 450,
    tarifa_max: 700,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "03.01.03",
    concepto: "Foquista",
    categoria: "Técnico",
    tarifa_min: 200,
    tarifa_media: 300,
    tarifa_max: 500,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Presupuesto El Desvío",
    fecha_actualizacion: "2025-01-18",
    notas: "€210/día pack completo"
  },
  {
    codigo_icaa: "03.01.04",
    concepto: "Auxiliar de Cámara",
    categoria: "Auxiliar",
    tarifa_min: 100,
    tarifa_media: 150,
    tarifa_max: 200,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  // Eléctricos
  {
    codigo_icaa: "03.02.01",
    concepto: "Jefe Eléctricos",
    categoria: "Jefe Departamento",
    tarifa_min: 350,
    tarifa_media: 500,
    tarifa_max: 800,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "03.02.02",
    concepto: "Eléctrico",
    categoria: "Técnico",
    tarifa_min: 150,
    tarifa_media: 200,
    tarifa_max: 300,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  // Maquinistas
  {
    codigo_icaa: "03.03.01",
    concepto: "Jefe Maquinistas",
    categoria: "Jefe Departamento",
    tarifa_min: 300,
    tarifa_media: 450,
    tarifa_max: 700,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "03.03.02",
    concepto: "Maquinista",
    categoria: "Técnico",
    tarifa_min: 150,
    tarifa_media: 220,
    tarifa_max: 350,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  // Sonido
  {
    codigo_icaa: "03.04.01",
    concepto: "Ingeniero de Sonido",
    categoria: "Jefe Departamento",
    tarifa_min: 300,
    tarifa_media: 450,
    tarifa_max: 700,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "03.04.02",
    concepto: "Microfonista",
    categoria: "Técnico",
    tarifa_min: 150,
    tarifa_media: 220,
    tarifa_max: 350,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  // Video Assist
  {
    codigo_icaa: "03.05.01",
    concepto: "Video Assist",
    categoria: "Técnico",
    tarifa_min: 150,
    tarifa_media: 200,
    tarifa_max: 300,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 04: DECORADOS Y ATTREZZO
// ============================================
export const TARIFAS_DECORADOS: TarifaSalarial[] = [
  {
    codigo_icaa: "04.01.01",
    concepto: "Director de Arte",
    categoria: "Jefe Departamento",
    tarifa_min: 400,
    tarifa_media: 600,
    tarifa_max: 1000,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "04.01.02",
    concepto: "Ayudante Dirección Arte",
    categoria: "Ayudante",
    tarifa_min: 150,
    tarifa_media: 250,
    tarifa_max: 400,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "04.02.01",
    concepto: "Regidor/Attrezista",
    categoria: "Técnico",
    tarifa_min: 150,
    tarifa_media: 220,
    tarifa_max: 350,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 05: VESTUARIO Y CARACTERIZACIÓN
// ============================================
export const TARIFAS_VESTUARIO: TarifaSalarial[] = [
  {
    codigo_icaa: "05.01.01",
    concepto: "Diseñador Vestuario",
    categoria: "Jefe Departamento",
    tarifa_min: 300,
    tarifa_media: 500,
    tarifa_max: 900,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "05.01.02",
    concepto: "Ayudante Vestuario",
    categoria: "Ayudante",
    tarifa_min: 120,
    tarifa_media: 180,
    tarifa_max: 280,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "05.02.01",
    concepto: "Jefe Maquillaje",
    categoria: "Jefe Departamento",
    tarifa_min: 250,
    tarifa_media: 400,
    tarifa_max: 700,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "05.02.02",
    concepto: "Ayudante Maquillaje",
    categoria: "Ayudante",
    tarifa_min: 120,
    tarifa_media: 180,
    tarifa_max: 280,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "05.02.03",
    concepto: "Peluquero/a",
    categoria: "Técnico",
    tarifa_min: 200,
    tarifa_media: 350,
    tarifa_max: 600,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "05.03.01",
    concepto: "Maquillaje FX/Protésico",
    categoria: "Especialista",
    tarifa_min: 400,
    tarifa_media: 600,
    tarifa_max: 1200,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 06: DIRECCIÓN Y PRODUCCIÓN
// ============================================
export const TARIFAS_DIRECCION: TarifaSalarial[] = [
  {
    codigo_icaa: "06.01.01",
    concepto: "Director",
    categoria: "Director",
    tarifa_min: 8000,
    tarifa_media: 20000,
    tarifa_max: 80000,
    unidad: "película",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18",
    notas: "Varía enormemente según trayectoria"
  },
  {
    codigo_icaa: "06.02.01",
    concepto: "1º Ayudante Dirección",
    categoria: "Ayudante Dirección",
    tarifa_min: 300,
    tarifa_media: 450,
    tarifa_max: 700,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "06.02.02",
    concepto: "2º Ayudante Dirección",
    categoria: "Ayudante",
    tarifa_min: 150,
    tarifa_media: 220,
    tarifa_max: 350,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "06.03.01",
    concepto: "Script",
    categoria: "Técnico",
    tarifa_min: 200,
    tarifa_media: 300,
    tarifa_max: 500,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "06.04.01",
    concepto: "Productor Ejecutivo",
    categoria: "Productor",
    tarifa_min: 5000,
    tarifa_media: 12000,
    tarifa_max: 30000,
    unidad: "película",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "06.04.02",
    concepto: "Jefe Producción",
    categoria: "Jefe Departamento",
    tarifa_min: 350,
    tarifa_media: 500,
    tarifa_max: 800,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "06.04.03",
    concepto: "Ayudante Producción",
    categoria: "Ayudante",
    tarifa_min: 120,
    tarifa_media: 180,
    tarifa_max: 280,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18",
    notas: "€120/día auxiliar montaje"
  },
  {
    codigo_icaa: "06.05.01",
    concepto: "Coordinador Seguridad",
    categoria: "Técnico",
    tarifa_min: 200,
    tarifa_media: 300,
    tarifa_max: 500,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 07: ALQUILERES TÉCNICOS
// ============================================
export const TARIFAS_ALQUILERES: TarifaEquipamiento[] = [
  {
    codigo_icaa: "07.01.01",
    concepto: "Cámara ARRI Alexa Mini",
    categoria: "Alquiler Cámara",
    tarifa_min: 350,
    tarifa_media: 400,
    tarifa_max: 600,
    unidad: "día",
    fuente: "Presupuesto El Desvío - Jarana Films",
    fecha_actualizacion: "2025-01-18",
    notas: "€400/día con accesorios completos"
  },
  {
    codigo_icaa: "07.01.02",
    concepto: "Ópticas Zeiss Super Speed",
    categoria: "Alquiler Ópticas",
    tarifa_min: 200,
    tarifa_media: 250,
    tarifa_max: 400,
    unidad: "día",
    fuente: "Presupuesto El Desvío",
    fecha_actualizacion: "2025-01-18",
    notas: "€250/día set completo"
  },
  {
    codigo_icaa: "07.01.03",
    concepto: "Filtros y Accesorios Cámara",
    categoria: "Alquiler Accesorios",
    tarifa_min: 80,
    tarifa_media: 120,
    tarifa_max: 200,
    unidad: "día",
    fuente: "Presupuesto El Desvío",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "07.02.01",
    concepto: "Iluminación Pack Completo",
    categoria: "Alquiler Luces",
    tarifa_min: 300,
    tarifa_media: 500,
    tarifa_max: 1000,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "07.03.01",
    concepto: "Maquinaria (Dollies, Grúas)",
    categoria: "Alquiler Maquinaria",
    tarifa_min: 200,
    tarifa_media: 400,
    tarifa_max: 800,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "07.04.01",
    concepto: "Sonido Directo Pack",
    categoria: "Alquiler Sonido",
    tarifa_min: 200,
    tarifa_media: 350,
    tarifa_max: 600,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "07.05.01",
    concepto: "Generador",
    categoria: "Alquiler Generador",
    tarifa_min: 150,
    tarifa_media: 250,
    tarifa_max: 500,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 08: TRANSPORTES, VIAJES Y DIETAS
// ============================================
export const TARIFAS_TRANSPORTES: TarifaEquipamiento[] = [
  {
    codigo_icaa: "08.01.01",
    concepto: "Vehículo Producción",
    categoria: "Transporte",
    tarifa_min: 100,
    tarifa_media: 150,
    tarifa_max: 250,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "08.02.01",
    concepto: "Camión Iluminación/Maquinaria",
    categoria: "Transporte Técnico",
    tarifa_min: 200,
    tarifa_media: 350,
    tarifa_max: 600,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "08.04.01",
    concepto: "Dieta Completa",
    categoria: "Dietas",
    tarifa_min: 40,
    tarifa_media: 50,
    tarifa_max: 70,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18",
    notas: "Por persona"
  },
  {
    codigo_icaa: "08.04.02",
    concepto: "Alojamiento",
    categoria: "Hoteles",
    tarifa_min: 60,
    tarifa_media: 80,
    tarifa_max: 120,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18",
    notas: "Por persona/noche"
  },
  {
    codigo_icaa: "08.05.01",
    concepto: "Catering Rodaje",
    categoria: "Catering",
    tarifa_min: 12,
    tarifa_media: 18,
    tarifa_max: 25,
    unidad: "día",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18",
    notas: "Por persona (almuerzo)"
  }
];

// ============================================
// CAPÍTULO 09: SEGUROS Y PERMISOS
// ============================================
export const TARIFAS_SEGUROS: TarifaEquipamiento[] = [
  {
    codigo_icaa: "09.01.01",
    concepto: "Seguro Responsabilidad Civil",
    categoria: "Seguros",
    tarifa_min: 2000,
    tarifa_media: 4000,
    tarifa_max: 8000,
    unidad: "película",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "09.02.01",
    concepto: "Seguro de Negativo/Material",
    categoria: "Seguros",
    tarifa_min: 1500,
    tarifa_media: 3000,
    tarifa_max: 6000,
    unidad: "película",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "09.03.01",
    concepto: "Permisos Rodaje (promedio)",
    categoria: "Permisos",
    tarifa_min: 500,
    tarifa_media: 1500,
    tarifa_max: 5000,
    unidad: "película",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 10: POSTPRODUCCIÓN
// ============================================
export const TARIFAS_POSTPRODUCCION: TarifaSalarial[] = [
  {
    codigo_icaa: "10.01.01",
    concepto: "Montador",
    categoria: "Jefe Departamento",
    tarifa_min: 400,
    tarifa_media: 600,
    tarifa_max: 1000,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.01.02",
    concepto: "Auxiliar Montaje",
    categoria: "Auxiliar",
    tarifa_min: 100,
    tarifa_media: 120,
    tarifa_max: 180,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.01.03",
    concepto: "Sala Edición",
    categoria: "Alquiler",
    tarifa_min: 50,
    tarifa_media: 70,
    tarifa_max: 120,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.02.01",
    concepto: "Colorista",
    categoria: "Jefe Departamento",
    tarifa_min: 1400,
    tarifa_media: 1600,
    tarifa_max: 2000,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Presupuesto La Muerte de Séneca - Antaviana",
    fecha_actualizacion: "2025-01-18",
    notas: "€1,600/día para HDR en monitor 4K"
  },
  {
    codigo_icaa: "10.02.02",
    concepto: "Conformado 4K",
    categoria: "Servicio",
    tarifa_min: 700,
    tarifa_media: 910,
    tarifa_max: 1200,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.02.03",
    concepto: "Color Grading 4K (2 semanas)",
    categoria: "Servicio",
    tarifa_min: 15000,
    tarifa_media: 17000,
    tarifa_max: 25000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto El Colorado",
    fecha_actualizacion: "2025-01-18",
    notas: "€17,000 conformado + corrección color 2 semanas"
  },
  {
    codigo_icaa: "10.03.01",
    concepto: "Diseñador Sonido",
    categoria: "Jefe Departamento",
    tarifa_min: 650,
    tarifa_media: 700,
    tarifa_max: 900,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18",
    notas: "€680-715/día según experiencia"
  },
  {
    codigo_icaa: "10.03.02",
    concepto: "Foley Pack Completo",
    categoria: "Servicio",
    tarifa_min: 8000,
    tarifa_media: 10000,
    tarifa_max: 15000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18",
    notas: "€10,000 incluye artista y técnico"
  },
  {
    codigo_icaa: "10.03.03",
    concepto: "Mezclas 5.1",
    categoria: "Servicio",
    tarifa_min: 6000,
    tarifa_media: 10000,
    tarifa_max: 18000,
    unidad: "película",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.04.01",
    concepto: "Subtitulado (pautado)",
    categoria: "Servicio",
    tarifa_min: 4,
    tarifa_media: 4.45,
    tarifa_max: 5,
    unidad: "minuto",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.04.02",
    concepto: "Traducción EN",
    categoria: "Servicio",
    tarifa_min: 9,
    tarifa_media: 10.8,
    tarifa_max: 12,
    unidad: "minuto",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "10.04.03",
    concepto: "Audiodescripción",
    categoria: "Servicio",
    tarifa_min: 20,
    tarifa_media: 22,
    tarifa_max: 25,
    unidad: "minuto",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 11: VFX Y LABORATORIO
// ============================================
export const TARIFAS_VFX: (TarifaSalarial | TarifaEquipamiento)[] = [
  {
    codigo_icaa: "11.01.01",
    concepto: "VFX Simple (remociones)",
    categoria: "VFX",
    tarifa_min: 500,
    tarifa_media: 1000,
    tarifa_max: 2000,
    unidad: "plano" as const,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "11.01.02",
    concepto: "VFX Medio (composiciones)",
    categoria: "VFX",
    tarifa_min: 2000,
    tarifa_media: 5000,
    tarifa_max: 10000,
    unidad: "plano" as const,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "11.01.03",
    concepto: "VFX Complejo (3D, crowds)",
    categoria: "VFX",
    tarifa_min: 10000,
    tarifa_media: 25000,
    tarifa_max: 50000,
    unidad: "secuencia" as const,
    fuente: "Presupuesto La Muerte de Séneca VFX",
    fecha_actualizacion: "2025-01-18",
    notas: "€200k para gemelos, caída 3D, crowds"
  },
  {
    codigo_icaa: "11.02.01",
    concepto: "DCP 4K",
    categoria: "Laboratorio",
    tarifa_min: 2000,
    tarifa_media: 2250,
    tarifa_max: 3000,
    unidad: "película",
    fuente: "Presupuesto La Muerte de Séneca",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "11.02.02",
    concepto: "Master ProRes",
    categoria: "Laboratorio",
    tarifa_min: 500,
    tarifa_media: 800,
    tarifa_max: 1200,
    unidad: "película",
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// CAPÍTULO 12: GASTOS GENERALES
// ============================================
export const TARIFAS_GENERALES = {
  gastos_estructura_pct: 15,  // 15% sobre capítulos 01-11
  imprevistos_pct: 5,         // 5% sobre capítulos 01-11
  iva_pct: 21,                // IVA España
};

// ============================================
// TARIFAS ESPECIALES (Stunts, Niños, etc.)
// ============================================
export const TARIFAS_ESPECIALES: TarifaSalarial[] = [
  {
    codigo_icaa: "XX.01.01",
    concepto: "Coordinador Stunts",
    categoria: "Especialista",
    tarifa_min: 500,
    tarifa_media: 600,
    tarifa_max: 1000,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "XX.01.02",
    concepto: "Doble de Riesgo",
    categoria: "Especialista",
    tarifa_min: 300,
    tarifa_media: 500,
    tarifa_max: 800,
    unidad: "día",
    agencia_pct: 10,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "XX.02.01",
    concepto: "Profesor Niños en Set",
    categoria: "Especialista",
    tarifa_min: 100,
    tarifa_media: 150,
    tarifa_max: 200,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "XX.03.01",
    concepto: "Entrenador Animales",
    categoria: "Especialista",
    tarifa_min: 300,
    tarifa_media: 400,
    tarifa_max: 600,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 35,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  },
  {
    codigo_icaa: "XX.04.01",
    concepto: "Ambulancia Standby",
    categoria: "Servicio",
    tarifa_min: 200,
    tarifa_media: 300,
    tarifa_max: 500,
    unidad: "día",
    agencia_pct: 0,
    seguros_sociales_pct: 0,
    fuente: "Mercado español 2025",
    fecha_actualizacion: "2025-01-18"
  }
];

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtiene todas las tarifas en un solo array
 */
export function getAllTarifas(): (TarifaSalarial | TarifaEquipamiento)[] {
  return [
    ...TARIFAS_DESARROLLO,
    ...TARIFAS_ARTISTICO,
    ...TARIFAS_TECNICO,
    ...TARIFAS_DECORADOS,
    ...TARIFAS_VESTUARIO,
    ...TARIFAS_DIRECCION,
    ...TARIFAS_ALQUILERES,
    ...TARIFAS_TRANSPORTES,
    ...TARIFAS_SEGUROS,
    ...TARIFAS_POSTPRODUCCION,
    ...TARIFAS_VFX,
    ...TARIFAS_ESPECIALES,
  ];
}

/**
 * Busca una tarifa por código ICAA
 */
export function buscarTarifa(codigo: string): TarifaSalarial | TarifaEquipamiento | undefined {
  return getAllTarifas().find(t => t.codigo_icaa === codigo);
}

/**
 * Busca tarifas por concepto (búsqueda parcial)
 */
export function buscarTarifaPorConcepto(concepto: string): (TarifaSalarial | TarifaEquipamiento)[] {
  const normalizado = concepto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return getAllTarifas().filter(t => 
    t.concepto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizado)
  );
}

/**
 * Obtiene tarifas por capítulo ICAA
 */
export function getTarifasPorCapitulo(capitulo: number): (TarifaSalarial | TarifaEquipamiento)[] {
  const prefix = capitulo.toString().padStart(2, '0') + '.';
  return getAllTarifas().filter(t => t.codigo_icaa.startsWith(prefix));
}

/**
 * Selecciona tarifa según nivel de presupuesto
 */
export function getTarifaPorNivel(
  tarifa: TarifaSalarial | TarifaEquipamiento, 
  nivel: 'bajo' | 'medio' | 'alto'
): number {
  switch (nivel) {
    case 'bajo':
      return tarifa.tarifa_min;
    case 'medio':
      return tarifa.tarifa_media;
    case 'alto':
      return tarifa.tarifa_max;
    default:
      return tarifa.tarifa_media;
  }
}

/**
 * Calcula el coste total de una línea presupuestaria incluyendo agencia, SS e IVA
 */
export function calcularCosteCompleto(
  tarifa: TarifaSalarial | TarifaEquipamiento,
  cantidad: number,
  nivel: 'bajo' | 'medio' | 'alto' = 'medio',
  incluirIVA: boolean = true
): {
  base: number;
  agencia: number;
  seguros_sociales: number;
  subtotal: number;
  iva: number;
  total: number;
} {
  const precioUnitario = getTarifaPorNivel(tarifa, nivel);
  const base = precioUnitario * cantidad;
  
  const agenciaPct = 'agencia_pct' in tarifa ? tarifa.agencia_pct : 0;
  const ssPct = 'seguros_sociales_pct' in tarifa ? tarifa.seguros_sociales_pct : 0;
  
  const agencia = base * (agenciaPct / 100);
  const baseConAgencia = base + agencia;
  const seguros_sociales = baseConAgencia * (ssPct / 100);
  const subtotal = baseConAgencia + seguros_sociales;
  const iva = incluirIVA ? subtotal * (TARIFAS_GENERALES.iva_pct / 100) : 0;
  const total = subtotal + iva;
  
  return {
    base: Math.round(base * 100) / 100,
    agencia: Math.round(agencia * 100) / 100,
    seguros_sociales: Math.round(seguros_sociales * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export default {
  TARIFAS_DESARROLLO,
  TARIFAS_ARTISTICO,
  TARIFAS_TECNICO,
  TARIFAS_DECORADOS,
  TARIFAS_VESTUARIO,
  TARIFAS_DIRECCION,
  TARIFAS_ALQUILERES,
  TARIFAS_TRANSPORTES,
  TARIFAS_SEGUROS,
  TARIFAS_POSTPRODUCCION,
  TARIFAS_VFX,
  TARIFAS_GENERALES,
  TARIFAS_ESPECIALES,
  getAllTarifas,
  buscarTarifa,
  buscarTarifaPorConcepto,
  getTarifasPorCapitulo,
  getTarifaPorNivel,
  calcularCosteCompleto,
};
