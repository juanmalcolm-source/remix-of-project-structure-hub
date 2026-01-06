import { AnalisisGuion, Personaje, Localizacion, Secuencia } from '@/types/analisisGuion';

export type SeveridadWarning = 'error' | 'warning' | 'info';

export interface Warning {
  severidad: SeveridadWarning;
  categoria: 'coherencia' | 'calculos' | 'datos_faltantes';
  mensaje: string;
  recomendacion?: string;
  detalles?: string[];
}

export interface ResultadoValidacion {
  valido: boolean;
  warnings: Warning[];
  errores: Warning[];
  advertencias: Warning[];
  informacion: Warning[];
}

/**
 * Valida la coherencia de personajes en secuencias
 */
function validarCoherenciaPersonajes(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];
  const nombresPersonajes = new Set(
    analisis.personajes.map(p => p.nombre.toLowerCase())
  );

  const personajesNoEncontrados = new Set<string>();

  analisis.desglose_secuencias.forEach((secuencia, index) => {
    secuencia.personajes?.forEach(nombrePersonaje => {
      const nombreNormalizado = nombrePersonaje.toLowerCase();
      if (!nombresPersonajes.has(nombreNormalizado)) {
        personajesNoEncontrados.add(nombrePersonaje);
      }
    });
  });

  if (personajesNoEncontrados.size > 0) {
    warnings.push({
      severidad: 'warning',
      categoria: 'coherencia',
      mensaje: `${personajesNoEncontrados.size} personaje(s) mencionado(s) en secuencias no están en la lista de personajes`,
      recomendacion: 'Añadir estos personajes a la lista o corregir los nombres en las secuencias',
      detalles: Array.from(personajesNoEncontrados)
    });
  }

  return warnings;
}

/**
 * Valida la coherencia de localizaciones en secuencias
 */
function validarCoherenciaLocalizaciones(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];
  const localizacionesSet = new Set(
    analisis.localizaciones.map(l => l.nombre.toLowerCase())
  );

  const localizacionesNoEncontradas = new Set<string>();

  analisis.desglose_secuencias.forEach((secuencia, index) => {
    const locNormalizada = secuencia.localizacion.toLowerCase();
    if (!localizacionesSet.has(locNormalizada)) {
      localizacionesNoEncontradas.add(secuencia.localizacion);
    }
  });

  if (localizacionesNoEncontradas.size > 0) {
    warnings.push({
      severidad: 'warning',
      categoria: 'coherencia',
      mensaje: `${localizacionesNoEncontradas.size} localización(es) usada(s) en secuencias no están en la lista`,
      recomendacion: 'Añadir estas localizaciones a la lista o corregir los nombres',
      detalles: Array.from(localizacionesNoEncontradas)
    });
  }

  return warnings;
}

/**
 * Valida que los números de secuencia sean consecutivos
 */
function validarSecuenciasConsecutivas(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];
  
  if (analisis.desglose_secuencias.length === 0) {
    return warnings;
  }

  const numerosSecuencia = analisis.desglose_secuencias
    .map(s => s.numero_secuencia)
    .sort((a, b) => a - b);

  const saltos: number[] = [];
  const duplicados: number[] = [];

  for (let i = 0; i < numerosSecuencia.length - 1; i++) {
    const actual = numerosSecuencia[i];
    const siguiente = numerosSecuencia[i + 1];

    if (actual === siguiente) {
      if (!duplicados.includes(actual)) {
        duplicados.push(actual);
      }
    } else if (siguiente - actual > 1) {
      for (let j = actual + 1; j < siguiente; j++) {
        saltos.push(j);
      }
    }
  }

  if (duplicados.length > 0) {
    warnings.push({
      severidad: 'error',
      categoria: 'coherencia',
      mensaje: `Números de secuencia duplicados: ${duplicados.join(', ')}`,
      recomendacion: 'Corregir la numeración de secuencias para que sean únicas'
    });
  }

  if (saltos.length > 0 && saltos.length < 10) {
    warnings.push({
      severidad: 'info',
      categoria: 'coherencia',
      mensaje: `Saltos en numeración de secuencias detectados: ${saltos.join(', ')}`,
      recomendacion: 'Verificar si las secuencias omitidas fueron eliminadas intencionalmente'
    });
  }

  return warnings;
}

/**
 * Valida que la suma de octavos coincida con páginas totales
 */
function validarSumaOctavos(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];

  const sumaOctavos = analisis.desglose_secuencias.reduce(
    (sum, s) => sum + (s.paginas_octavos || 0),
    0
  );

  const paginasCalculadas = sumaOctavos / 8;
  const paginasTotales = analisis.informacion_general.paginas_totales;

  const diferencia = Math.abs(paginasCalculadas - paginasTotales);
  const tolerancia = paginasTotales * 0.1; // 10% de tolerancia

  if (diferencia > tolerancia) {
    warnings.push({
      severidad: 'warning',
      categoria: 'calculos',
      mensaje: `La suma de octavos (${paginasCalculadas.toFixed(1)} págs) difiere de páginas totales (${paginasTotales} págs)`,
      recomendacion: 'Revisar el desglose de octavos en las secuencias',
      detalles: [`Diferencia: ${diferencia.toFixed(1)} páginas`, `Tolerancia: ${tolerancia.toFixed(1)} páginas`]
    });
  }

  return warnings;
}

/**
 * Valida coherencia de días de rodaje
 */
function validarDiasRodaje(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];

  const paginasTotales = analisis.informacion_general.paginas_totales;
  const { estimacion_minima, estimacion_maxima, estimacion_recomendada } = 
    analisis.resumen_produccion.dias_rodaje;

  // Regla general: 3-5 páginas por día de rodaje
  const diasMinimosEsperados = Math.ceil(paginasTotales / 5);
  const diasMaximosEsperados = Math.ceil(paginasTotales / 3);

  if (estimacion_recomendada < diasMinimosEsperados) {
    warnings.push({
      severidad: 'warning',
      categoria: 'calculos',
      mensaje: `Días de rodaje recomendados (${estimacion_recomendada}) parecen bajos para ${paginasTotales} páginas`,
      recomendacion: `Considerar entre ${diasMinimosEsperados} y ${diasMaximosEsperados} días`,
      detalles: [`Promedio esperado: 3-5 páginas por día`]
    });
  }

  if (estimacion_recomendada > diasMaximosEsperados * 2) {
    warnings.push({
      severidad: 'info',
      categoria: 'calculos',
      mensaje: `Días de rodaje recomendados (${estimacion_recomendada}) parecen altos para ${paginasTotales} páginas`,
      recomendacion: 'Verificar complejidad de secuencias o considerar optimizar',
      detalles: [`Promedio esperado: 3-5 páginas por día`]
    });
  }

  if (estimacion_minima > estimacion_recomendada) {
    warnings.push({
      severidad: 'error',
      categoria: 'calculos',
      mensaje: 'Estimación mínima de días es mayor que la recomendada',
      recomendacion: 'Corregir las estimaciones de días de rodaje'
    });
  }

  if (estimacion_maxima < estimacion_recomendada) {
    warnings.push({
      severidad: 'error',
      categoria: 'calculos',
      mensaje: 'Estimación máxima de días es menor que la recomendada',
      recomendacion: 'Corregir las estimaciones de días de rodaje'
    });
  }

  return warnings;
}

/**
 * Valida categorización de personajes
 */
function validarCategorizacionPersonajes(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];

  const { protagonistas, principales, secundarios, figuracion } = 
    analisis.resumen_produccion.total_personajes;

  // Al menos debe haber 1 protagonista
  if (protagonistas === 0) {
    warnings.push({
      severidad: 'warning',
      categoria: 'coherencia',
      mensaje: 'No se identificaron protagonistas en el guión',
      recomendacion: 'Revisar la categorización de personajes principales'
    });
  }

  // Demasiados protagonistas puede ser un error
  if (protagonistas > 3) {
    warnings.push({
      severidad: 'info',
      categoria: 'coherencia',
      mensaje: `${protagonistas} protagonistas detectados. Esto es inusual`,
      recomendacion: 'Verificar si algunos deberían ser categorizados como principales'
    });
  }

  // Validar coherencia entre categoría e importancia
  analisis.personajes.forEach(personaje => {
    if (personaje.categoria === 'PROTAGONISTA' && personaje.importancia_trama !== 'Alta') {
      warnings.push({
        severidad: 'warning',
        categoria: 'coherencia',
        mensaje: `${personaje.nombre} es PROTAGONISTA pero tiene importancia "${personaje.importancia_trama}"`,
        recomendacion: 'Los protagonistas deberían tener importancia Alta'
      });
    }

    if (personaje.categoria === 'FIGURACION' && personaje.dialogos_principales) {
      warnings.push({
        severidad: 'warning',
        categoria: 'coherencia',
        mensaje: `${personaje.nombre} es FIGURACIÓN pero tiene diálogos principales`,
        recomendacion: 'Revisar categorización o flag de diálogos principales'
      });
    }
  });

  return warnings;
}

/**
 * Valida datos faltantes o incompletos
 */
function validarDatosFaltantes(
  analisis: AnalisisGuion
): Warning[] {
  const warnings: Warning[] = [];

  // Información general
  if (!analisis.informacion_general.titulo || analisis.informacion_general.titulo.trim() === '') {
    warnings.push({
      severidad: 'warning',
      categoria: 'datos_faltantes',
      mensaje: 'Falta el título del guión',
      recomendacion: 'Completar manualmente en la información general'
    });
  }

  if (!analisis.informacion_general.genero || analisis.informacion_general.genero.trim() === '') {
    warnings.push({
      severidad: 'info',
      categoria: 'datos_faltantes',
      mensaje: 'No se identificó el género del guión',
      recomendacion: 'Añadir género manualmente'
    });
  }

  // Personajes sin descripción
  const personajesSinDescripcion = analisis.personajes.filter(
    p => !p.descripcion || p.descripcion.trim() === ''
  );

  if (personajesSinDescripcion.length > 0) {
    warnings.push({
      severidad: 'info',
      categoria: 'datos_faltantes',
      mensaje: `${personajesSinDescripcion.length} personaje(s) sin descripción`,
      recomendacion: 'Añadir descripciones para mejor casting',
      detalles: personajesSinDescripcion.map(p => p.nombre)
    });
  }

  // Localizaciones sin descripción o necesidades especiales
  const localizacionesSinDetalle = analisis.localizaciones.filter(
    l => (!l.descripcion || l.descripcion.trim() === '') && 
         (!l.necesidades_especiales || l.necesidades_especiales.length === 0)
  );

  if (localizacionesSinDetalle.length > 0) {
    warnings.push({
      severidad: 'info',
      categoria: 'datos_faltantes',
      mensaje: `${localizacionesSinDetalle.length} localización(es) sin descripción ni necesidades especiales`,
      recomendacion: 'Completar detalles para mejor planificación',
      detalles: localizacionesSinDetalle.map(l => l.nombre)
    });
  }

  // Secuencias sin attrezzo, vestuario
  const secuenciasSinDetalles = analisis.desglose_secuencias.filter(
    s => (!s.attrezzo || s.attrezzo.length === 0) && 
         (!s.vestuario || s.vestuario.length === 0)
  );

  if (secuenciasSinDetalles.length > 5) {
    warnings.push({
      severidad: 'info',
      categoria: 'datos_faltantes',
      mensaje: `${secuenciasSinDetalles.length} secuencia(s) sin detalles de attrezzo o vestuario`,
      recomendacion: 'Revisar y completar desglose para producción'
    });
  }

  return warnings;
}

/**
 * Función principal de validación
 */
export function validarAnalisis(analisis: AnalisisGuion): ResultadoValidacion {
  const warnings: Warning[] = [];

  // Ejecutar todas las validaciones
  warnings.push(...validarCoherenciaPersonajes(analisis));
  warnings.push(...validarCoherenciaLocalizaciones(analisis));
  warnings.push(...validarSecuenciasConsecutivas(analisis));
  warnings.push(...validarSumaOctavos(analisis));
  warnings.push(...validarDiasRodaje(analisis));
  warnings.push(...validarCategorizacionPersonajes(analisis));
  warnings.push(...validarDatosFaltantes(analisis));

  // Clasificar warnings por severidad
  const errores = warnings.filter(w => w.severidad === 'error');
  const advertencias = warnings.filter(w => w.severidad === 'warning');
  const informacion = warnings.filter(w => w.severidad === 'info');

  return {
    valido: errores.length === 0,
    warnings,
    errores,
    advertencias,
    informacion
  };
}

/**
 * Genera un reporte legible de validación
 */
export function generarReporteValidacion(resultado: ResultadoValidacion): string {
  const lineas: string[] = [];

  lineas.push('=== REPORTE DE VALIDACIÓN ===\n');
  lineas.push(`Estado: ${resultado.valido ? '✓ VÁLIDO' : '✗ ERRORES DETECTADOS'}\n`);
  lineas.push(`Total warnings: ${resultado.warnings.length}`);
  lineas.push(`- Errores: ${resultado.errores.length}`);
  lineas.push(`- Advertencias: ${resultado.advertencias.length}`);
  lineas.push(`- Información: ${resultado.informacion.length}\n`);

  if (resultado.errores.length > 0) {
    lineas.push('🔴 ERRORES:');
    resultado.errores.forEach((error, i) => {
      lineas.push(`\n${i + 1}. ${error.mensaje}`);
      if (error.recomendacion) {
        lineas.push(`   → ${error.recomendacion}`);
      }
      if (error.detalles) {
        error.detalles.forEach(detalle => {
          lineas.push(`     • ${detalle}`);
        });
      }
    });
    lineas.push('');
  }

  if (resultado.advertencias.length > 0) {
    lineas.push('⚠️  ADVERTENCIAS:');
    resultado.advertencias.forEach((warning, i) => {
      lineas.push(`\n${i + 1}. ${warning.mensaje}`);
      if (warning.recomendacion) {
        lineas.push(`   → ${warning.recomendacion}`);
      }
      if (warning.detalles && warning.detalles.length <= 5) {
        warning.detalles.forEach(detalle => {
          lineas.push(`     • ${detalle}`);
        });
      }
    });
    lineas.push('');
  }

  if (resultado.informacion.length > 0) {
    lineas.push('ℹ️  INFORMACIÓN:');
    resultado.informacion.forEach((info, i) => {
      lineas.push(`\n${i + 1}. ${info.mensaje}`);
      if (info.recomendacion) {
        lineas.push(`   → ${info.recomendacion}`);
      }
    });
    lineas.push('');
  }

  lineas.push('=== FIN REPORTE ===');

  return lineas.join('\n');
}
