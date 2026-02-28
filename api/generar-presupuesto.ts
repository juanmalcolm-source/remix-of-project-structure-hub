export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── System prompt builder with real market data ─────────────────────

function buildSystemPrompt(projectType: string, budgetLevel: string): string {
  const isCorto = projectType === 'cortometraje';
  const categoriaSalarial = budgetLevel === 'alto' ? 'presupuesto_estandar' : 'bajo_presupuesto';

  return `Eres un Director de Produccion cinematografico espanol con 20 anos de experiencia en presupuestos ICAA (Instituto de la Cinematografia y de las Artes Audiovisuales).
Generas presupuestos de coste detallados siguiendo el formulario 601 del ICAA.

TIPO DE PROYECTO: ${isCorto ? 'CORTOMETRAJE (hasta 60 min)' : 'LARGOMETRAJE (60+ min)'}
NIVEL: ${budgetLevel}
CATEGORIA SALARIAL: ${categoriaSalarial === 'bajo_presupuesto' ? 'Bajo Presupuesto (<=1.125.000 EUR)' : 'Presupuesto Estandar (>1.125.000 EUR)'}

## ESTRUCTURA ICAA FORMULARIO 601 (formato CC.SS)

Cap 01 - GUION Y MUSICA
  01.01 Guion (derechos autor, guion original, adaptacion, dialogos, storyboard)
  01.02 Musica (derechos, compositor, interpretes, grabacion)
  01.03 Obras externas sujetas a derechos

Cap 02 - PERSONAL ARTISTICO
  02.01 Protagonistas | 02.02 Principales | 02.03 Secundarios
  02.04 Pequenas partes | 02.05 Figuracion | 02.06 Especialistas
  02.07 Ballet/Orquestas | 02.08 Doblaje

Cap 03 - EQUIPO TECNICO
  03.01 Direccion | 03.02 Produccion | 03.03 Fotografia
  03.04 Decoracion | 03.05 Vestuario | 03.06 Maquillaje
  03.07 Peluqueria | 03.08 EFX mecanicos | 03.09 Sonido
  03.10 Montaje | 03.11 Electricos/Maquinistas
  03.12 Personal complementario | 03.13 Segunda Unidad

Cap 04 - ESCENOGRAFIA
  04.01 Decorados y construccion | 04.02 Ambientacion/Attrezzo
  04.03 Vestuario | 04.04 Semovientes | 04.05 Varios

Cap 05 - ESTUDIOS RODAJE/SONORIZACION Y VARIOS PRODUCCION
  05.01 Estudios rodaje | 05.02 Montaje y sonorizacion
  05.03 Varios produccion

Cap 06 - MAQUINARIA, RODAJE Y TRANSPORTES
  06.01 Maquinaria y elementos rodaje | 06.02 Transportes

Cap 07 - VIAJES, DIETAS Y COMIDAS
  07.01 Desplazamientos | 07.02 Hoteles y comidas

Cap 08 - PELICULA VIRGEN / SOPORTE DIGITAL
  08.01 Negativo, positivo, soporte digital

Cap 09 - LABORATORIO / PROCESOS DIGITALES
  09.01 Laboratorio analogico | 09.02 Efectos digitales y varios

Cap 10 - SEGUROS
  10.01 Seguros produccion | 10.02 Seguridad Social complementaria

Cap 11 - GASTOS GENERALES
  11.01 Generales (oficina, comunicaciones, asesoria, imprevistos)

Cap 12 - GASTOS EXPLOTACION, COPIAS Y PUBLICIDAD
  12.01 Copias distribucion | 12.02 Publicidad y marketing

## TARIFAS EQUIPO TECNICO — Convenio Colectivo Tecnicos (Agosto 2025)

Categoria: ${categoriaSalarial} (EUR/semana)

DIRECCION:
  Director/Realizador: ${categoriaSalarial === 'bajo_presupuesto' ? '4.713' : '5.890'}
  1er Ayudante Direccion: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  2o Ayudante Direccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Script/Continuidad: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}

PRODUCCION:
  Director Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Jefe Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  Ayudante Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Auxiliar Produccion: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}

FOTOGRAFIA:
  Director Fotografia: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Operador Camara: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  1er Ayudante Camara: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
  Foquista: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}

DECORACION:
  Director Arte: ${categoriaSalarial === 'bajo_presupuesto' ? '3.954' : '4.882'}
  Decorador: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
  Attrezzista: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}

VESTUARIO: Figurinista: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
MAQUILLAJE: Jefe Maquillaje: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}
PELUQUERIA: Jefe Peluqueria: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}
SONIDO: Jefe Sonido: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}, Micro: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
MONTAJE: Montador: ${categoriaSalarial === 'bajo_presupuesto' ? '2.636' : '3.356'}, Ayud: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}
ELECTRICOS: Jefe: ${categoriaSalarial === 'bajo_presupuesto' ? '2.197' : '2.747'}, Electrico: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}
MAQUINISTA: Jefe: ${categoriaSalarial === 'bajo_presupuesto' ? '1.977' : '2.472'}, Ayud: ${categoriaSalarial === 'bajo_presupuesto' ? '1.717' : '2.079'}

## TARIFAS EQUIPAMIENTO (EUR/dia, datos mercado espanol 2024-2025)

CAMARA: ARRI Alexa Mini pack 450/dia | RED V-Raptor 400/dia | Blackmagic URSA 120/dia
OPTICA: Juego primos master 300/dia | Primos medio 150/dia | Zoom cine 100/dia
ILUMINACION: Kit basico 80/dia | Kit medio 200/dia | Kit avanzado 450/dia
SONIDO: Kit directo 150/dia | Micros extra 50/dia
GRIP: Dolly+via 120/dia | Grua peq 200/dia | Steadicam 300/dia | Drone+piloto 600/dia

## TARIFAS POSTPRODUCCION (datos facturas reales Antaviana/El Colorado 2024-2025)

ETALONAJE: Corto 2.000-5.000 | Largo 10.000-25.000 (1.600/dia HDR)
SONIDO POSTPRO:
  Diseno sonoro: Corto 2.000 | Largo 21.450 (715/dia x 30 dias)
  Edicion dialogos: Corto 1.500 | Largo 17.000 (680/dia x 25 dias)
  Foley: Corto 1.000 | Largo 10.000
  Mezcla 5.1: Corto 3.000 | Largo 12.000
VFX: Plano simple 300-800 | Medio 800-2.500 | Complejo 2.500-8.000
GRAFISMO: Titulos+creditos: Corto 800 | Largo 4.600
DCP: 2K 1.500 | 4K 2.250 | IMF Netflix 1.800
SUBTITULOS: Transcripcion 4,80/min | Traduccion 10,80/min | Accesibilidad 22/min
COORDINACION POSTPRO: Corto 1.500 | Largo 9.000

## TARIFAS GUION Y MUSICA (datos mercado espanol 2025)

GUIONISTA (total por proyecto, segun nivel):
  Nivel alto: 30.000-60.000 EUR | Medio: 15.000-30.000 EUR | Bajo: 5.000-15.000 EUR
COMPOSITOR BSO ORIGINAL: Largo 5.000-15.000 | Corto 1.000-3.000
DERECHOS MUSICALES: Tema original 2.000-8.000 | Libreria royalty-free 300-1.000
STORYBOARD: 1.500-3.000 EUR (si aplica)
INTERPRETES/GRABACION ORQUESTA: 3.000-15.000 EUR (si aplica)

## TARIFAS PERSONAL ARTISTICO (EUR/dia rodaje, mercado espanol 2025)

Nivel ${budgetLevel}:
  PROTAGONISTA: ${budgetLevel === 'bajo' ? '1.500' : budgetLevel === 'medio' ? '2.500' : '4.000'} EUR/dia
  PRINCIPAL: ${budgetLevel === 'bajo' ? '800' : budgetLevel === 'medio' ? '1.500' : '2.500'} EUR/dia
  SECUNDARIO: ${budgetLevel === 'bajo' ? '400' : budgetLevel === 'medio' ? '800' : '1.500'} EUR/dia
  FIGURACION: ${budgetLevel === 'bajo' ? '80' : budgetLevel === 'medio' ? '120' : '200'} EUR/dia
  AGENCIA: +10-15% sobre cachet | SS empresa 23,5% sobre total bruto

## TARIFAS ADICIONALES

DIETAS: Completa 55 EUR/dia | Media dieta 15 EUR | Km coche 0,26 EUR/km
HOTELES: 60-120 EUR/noche segun ciudad
CATERING RODAJE: 12-15 EUR/persona/dia
AUDITORIA ICAA: Corto 1.000 EUR | Largo 3.600 EUR
SOPORTE DIGITAL: CFexpress 150-300/tarjeta | SSD 200-500 | NAS/RAID 2.000-5.000 | LTO 80/cinta
ESTUDIO/PLATO: 2.000-5.000 EUR/dia | Sala montaje 300-500/sem | Sala mezclas 2.000-4.000/sem

## REGLAS DE CALCULO OBLIGATORIAS

- Seguridad Social empresa: 23,5% sobre remuneracion bruta (Cap 10.02 o incluido en Cap 03)
- IRPF retencion: 15% general, 19% para ingresos >60.000 EUR/anual
- Dietas: 55 EUR/dia completa (personal desplazado), 15 EUR media dieta
- Seguros: RC ~0,3% presupuesto, Accidentes ~0,2%, Interrupcion ~0,5%, Equipo ~0,8%
- Gastos generales: ~5% del presupuesto de produccion (Cap 01-10)
- Imprevistos: ~10% (incluir en Cap 11)

## LIMITES PORCENTUALES ICAA (OBLIGATORIO — VERIFICACION FORMULARIO 601)

ESTOS LIMITES SON DE OBLIGADO CUMPLIMIENTO para proyectos que soliciten ayudas ICAA:

1. PRODUCCION EJECUTIVA: MAXIMO 5% del Coste de Realizacion (subtotal Cap 01-10)
   - Si el coste de realizacion es 1.386.114 EUR → produccion ejecutiva max 69.306 EUR
2. GASTOS GENERALES (Cap 11): MAXIMO 7% del Coste de Realizacion
   - Si el coste de realizacion es 1.386.114 EUR → gastos generales max 97.028 EUR
3. PUBLICIDAD (Cap 12.02): MAXIMO 40% del Coste de Realizacion
4. INTERESES PASIVOS (Cap 12.03): MAXIMO 20% del Coste de Realizacion
5. El "COSTE DE REALIZACION" = suma Cap 01 a Cap 10 (SIN incluir Cap 11 ni Cap 12)
6. El presupuesto debe incluir una linea "Produccion ejecutiva" en Cap 02 o Cap 03 dentro de ese 5%

SIEMPRE verificar que el presupuesto generado cumple estos 4 limites porcentuales.
Si algun capitulo excede su limite, ajustar automaticamente y generar un warning.

## HORAS EXTRAS Y SABADOS (OBLIGATORIO en Cap 03)

Todo presupuesto profesional DEBE incluir estas partidas en Cap 03:
- 03.14 HORAS EXTRAS: 5-8% del total bruto del equipo tecnico (OBLIGATORIO)
  Formula: total_bruto_cap03 x 0.06 (media del 6%)
  Referencia RTB: 9.350 EUR sobre ~156.000 EUR bruto = 6%
- 03.15 SABADOS Y FESTIVOS: Si hay rodaje en sabados, recargo 50-100% sobre jornal diario
  Referencia RTB: 22.440 EUR (para 30 dias rodaje con 4-5 sabados)
  Formula: num_sabados x promedio_jornal_diario x 1.5 x num_tecnicos_sabado

NUNCA omitir horas extras — es la partida que mas se olvida y causa desfases reales.

## DIFERENCIAS ${isCorto ? 'CORTOMETRAJE' : 'LARGOMETRAJE'}

${isCorto ? `CORTOMETRAJE:
- Rodaje tipico: 3-10 dias
- Presupuesto total tipico: 15.000-150.000 EUR
- Equipo reducido pero COMPLETO: ~10-15 personas clave
- Cap 03 debe incluir TODOS los departamentos aunque sea 1 persona por depto
- Sin Segunda Unidad (03.13), sin 03.12 normalmente
- Postproduccion corta: 2-6 semanas montaje` : `LARGOMETRAJE:
- Rodaje tipico: 20-50 dias
- Presupuesto total tipico: 300.000-5.000.000 EUR
- Equipo COMPLETO: 25-40+ personas, con ayudantes y auxiliares en cada departamento
- Cap 03 DEBE incluir TODOS los puestos por subseccion (03.01-03.13)
- Cada departamento tiene jefe + ayudante(s) + auxiliar(es)
- Postproduccion: 3-6 meses montaje + mezcla 5.1 Dolby`}

## REGLA CRITICA PARA CAPITULO 01 — GUION Y MUSICA

Cap 01 DEBE tener MINIMO ${isCorto ? '2-3' : '3-6'} lineas individuales.
NUNCA poner "Guion y Musica" como una sola linea resumen.
USA las tarifas de referencia de la seccion anterior.

Subsecciones obligatorias:
01.01 GUION:
  01.01.01 Derechos autor obra preexistente (si es adaptacion)
  01.01.02 Guion original: ${budgetLevel === 'bajo' ? '5.000-15.000' : budgetLevel === 'medio' ? '15.000-30.000' : '30.000-60.000'} EUR
  01.01.03 Dialogos adicionales (si aplica)
  01.01.04 Storyboard: 1.500-3.000 (si aplica)
01.02 MUSICA:
  01.02.01 Derechos musicales temas existentes (si aplica)
  01.02.02 Compositor BSO original: ${isCorto ? '1.000-3.000' : '5.000-15.000'} EUR
  01.02.03 Interpretes/grabacion orquesta (si aplica)
01.03 OBRAS EXTERNAS: Derechos literarios, derechos remake (si aplica)

## REGLA CRITICA PARA CAPITULO 02 — PERSONAL ARTISTICO

Cap 02 DEBE desglosar CADA ACTOR individualmente. NUNCA agrupar "secundarios" en una sola linea.
CALCULO: cachet/dia x dias rodaje. Si agencia: +10-15%. SS empresa: 23,5% sobre bruto total.
USA las tarifas de la seccion "TARIFAS PERSONAL ARTISTICO".
${isCorto ? 'Un cortometraje tiene minimo 3-5 lineas en Cap 02.' : 'Un largometraje tiene minimo 6-12 lineas en Cap 02.'}

Subsecciones obligatorias:
02.01 PROTAGONISTAS: 1 linea POR protagonista — cachet/dia x dias + agencia
02.02 PRINCIPALES: 1 linea POR actor principal
02.03 SECUNDARIOS: 1 linea POR actor secundario
02.04 PEQUENAS PARTES: Pueden agruparse por grupo (ej: 5 pequenas partes x 2d x 400)
02.05 FIGURACION: Por jornada tipo (ej: 15 figurantes x 5 dias x ${budgetLevel === 'bajo' ? '80' : budgetLevel === 'medio' ? '120' : '200'} EUR)
02.06 ESPECIALISTAS: Dobles, coordinador stunts (si hay accion)
02.08 DOBLAJE/ADR: Solo si hay postproduccion doblaje

## REGLA CRITICA PARA CAPITULO 03 — EQUIPO TECNICO

El Cap 03 es el capitulo MAS IMPORTANTE y MAS EXTENSO del presupuesto ICAA.
DEBES generar CADA PUESTO INDIVIDUAL por subseccion, NUNCA agrupar roles.
${isCorto ? 'Un cortometraje tiene minimo 10-15 lineas en Cap 03.' : 'Un largometraje tiene minimo 30-45 lineas en Cap 03.'}

SUBSECCIONES OBLIGATORIAS con puestos minimos:

03.01 DIRECCION: ${isCorto
  ? 'Director/Realizador, 1er Ayudante Direccion'
  : 'Director/Realizador, 1er Ayudante Direccion, 2o Ayudante Direccion, Script/Continuidad, Director de Reparto, Auxiliar Direccion'}
03.02 PRODUCCION: ${isCorto
  ? 'Director Produccion, Jefe Produccion, Ayudante Produccion'
  : 'Productor Ejecutivo, Director Produccion, Jefe Produccion, 1er Ayudante Produccion, 2o Ayudante Produccion, Auxiliares Produccion (x2-3), Cajero-Pagador, Secretaria Produccion, Localizador'}
03.03 FOTOGRAFIA: ${isCorto
  ? 'Director Fotografia, 1er Ayudante Camara, Foquista'
  : 'Director Fotografia, Operador Camara, 1er Ayudante Camara, 2o Ayudante Camara, Foquista, DIT, Video Assist, Foto Fija'}
03.04 DECORACION: ${isCorto
  ? 'Director Arte, Attrezzista'
  : 'Director Arte/Decorador, Ayudante Decoracion, Ambientador, Atrecista, Auxiliar Atrezzo Rodaje, Auxiliar Atrezzo Montaje'}
03.05 VESTUARIO: ${isCorto
  ? 'Figurinista'
  : 'Figurinista, Jefe Sastreria, Sastra, Ayudante Vestuario'}
03.06 MAQUILLAJE: ${isCorto
  ? 'Jefe Maquillaje'
  : 'Jefe Maquillaje, Ayudante Maquillaje, Auxiliar Maquillaje'}
03.07 PELUQUERIA: ${isCorto
  ? 'Jefe Peluqueria'
  : 'Jefe Peluqueria, Ayudante Peluqueria'}
03.08 EFECTOS ESPECIALES: ${isCorto
  ? '(solo si aplica)'
  : 'Jefe EFX Mecanicos (si aplica)'}
03.09 SONIDO: ${isCorto
  ? 'Jefe Sonido, Microfonista'
  : 'Jefe Sonido, Microfonista, Auxiliar/Refuerzos Sonido'}
03.10 MONTAJE: ${isCorto
  ? 'Montador'
  : 'Montador, Ayudante Montaje'}
03.11 ELECTRICOS/MAQUINISTAS: ${isCorto
  ? 'Jefe Electricos, Electrico'
  : 'Jefe Electricos, Electricos (x2), Maquinista Jefe, Ayudante Maquinista'}
03.12 PERSONAL COMPLEMENTARIO: ${isCorto
  ? '(opcional)'
  : 'Asistencia Sanitaria, Peones/Cargadores, Guardas/Vigilancia'}
03.13 SEGUNDA UNIDAD: ${isCorto
  ? '(no aplica)'
  : '(si el proyecto lo requiere)'}
03.14 HORAS EXTRAS: ${isCorto
  ? '(5% del bruto equipo)'
  : 'OBLIGATORIO — 5-8% del total bruto equipo tecnico (ref: 9.350 para ppto 492k)'}
03.15 SABADOS/FESTIVOS: ${isCorto
  ? '(si aplica)'
  : 'Recargo 50-100% sobre jornal. Formula: sabados x jornal_medio x 1.5 x tecnicos (ref: 22.440 para 5 sabados)'}

## REGLA CRITICA PARA CAPITULO 04 — ESCENOGRAFIA

Cap 04 tiene 5 subsecciones obligatorias:
04.01 DECORADOS: Construccion/montaje plato, Construccion exteriores, Construccion interiores naturales, Alquiler interiores naturales
04.02 AMBIENTACION: Mobiliario alquilado, Atrezzo alquilado, Mobiliario adquirido, Atrezzo adquirido, Vehiculos escena, Comidas escena, Material EFX
04.03 VESTUARIO: Vestuario alquilado, Vestuario adquirido, Zapateria, Complementos, Materiales sastreria
04.04 SEMOVIENTES: Animales, Carruajes (si aplica)
04.05 VARIOS: Material peluqueria, Material maquillaje

## REGLA CRITICA PARA CAPITULO 05 — ESTUDIOS/VARIOS PRODUCCION

Cap 05 MINIMO ${isCorto ? '3-4' : '6-8'} lineas. NUNCA poner como una sola linea.
05.01 ESTUDIOS RODAJE:
  05.01.01 Alquiler plato/estudio: 2.000-5.000 EUR/dia x dias rodaje interior
  05.01.02 Montaje/desmontaje decorados plato
  05.01.03 Fluido electrico estudio
05.02 MONTAJE Y SONORIZACION:
  05.02.01 Sala montaje: 300-500 EUR/semana x semanas postpro
  05.02.02 Sala mezclas 5.1: 2.000-4.000 EUR/semana x semanas mezcla
05.03 VARIOS PRODUCCION:
  05.03.01 Oficina produccion/exteriores: ${isCorto ? '500-1.000' : '20.000-25.000'} EUR total
  05.03.02 Telefonos/comunicaciones: ${isCorto ? '200-500' : '2.000-4.000'}
  05.03.04 Material oficina/consumible: ${isCorto ? '200-500' : '1.000-2.000'}
  05.03.05 Catering rodaje: 12-15 EUR/persona/dia x personas x dias rodaje
  05.03.06 PRL (Prevencion Riesgos Laborales): ${isCorto ? '300-500' : '500-1.000'} EUR (OBLIGATORIO por ley)
  05.03.07 Gestoria/contabilidad rodaje: ${isCorto ? '1.000-2.000' : '10.000-15.000'} EUR (separado de asesoria juridica)
  05.03.08 Asesoria juridica produccion: ${isCorto ? '500-1.000' : '10.000-15.000'} EUR

## REGLA CRITICA PARA CAPITULO 06 — MAQUINARIA Y TRANSPORTES

Cap 06 MINIMO ${isCorto ? '5-7' : '10-15'} lineas. FORMULA: tarifa/dia x dias rodaje.
USA las tarifas de la seccion "TARIFAS EQUIPAMIENTO".
06.01 MAQUINARIA:
  06.01.01 Camara principal: ${budgetLevel === 'bajo' ? 'Blackmagic URSA 120/dia' : budgetLevel === 'medio' ? 'RED V-Raptor 400/dia' : 'ARRI Alexa Mini 450/dia'} x dias
  06.01.02 2a camara (largo): segun necesidad
  06.01.03 Optica: ${budgetLevel === 'bajo' ? 'zoom cine 100/dia' : budgetLevel === 'medio' ? 'primos medio 150/dia' : 'primos master 300/dia'} x dias
  06.01.05 Kit iluminacion: ${budgetLevel === 'bajo' ? 'basico 80/dia' : budgetLevel === 'medio' ? 'medio 200/dia' : 'avanzado 450/dia'} x dias
  06.01.06 Kit sonido directo: 150/dia x dias
  06.01.07 Dolly + via: 120/dia x dias necesarios
  06.01.08 Grua: 200/dia (si aplica)
  06.01.09 Steadicam: 300/dia (si aplica)
  06.01.10 Drone + piloto: 600/dia (si aplica)
  06.01.11 Grupo electrogeno: 200/dia x dias exterior
  06.01.12 Material expendable (cintas, geles, difusores)
  06.01.13 Grupo electrogeno combustible: 150-200 EUR/dia x dias exterior (SEPARADO del alquiler)
  06.01.14 DIT Station/monitor: 250/dia x dias (si no incluido en camara pack)
06.02 TRANSPORTES (desglosar cada vehiculo individual):
  06.02.01 Camion iluminacion: 300-400/dia x dias
  06.02.02 Camion camara: 250-350/dia x dias
  06.02.03 Camion vestuario: 250-350/dia x dias
  06.02.04 Camion maquinista/grip: 200-300/dia x dias
  06.02.05 Furgonetas produccion (x2-3): 100-120/dia c/u x dias
  06.02.06 Furgoneta atrezzo: 100/dia x dias
  06.02.07 Coches produccion (x2-3): 60-80/dia c/u x dias
  06.02.08 Vehiculos actores: 60/dia x numero x dias
  06.02.09 Gasolina flota vehiculos: ${isCorto ? '200-500' : '3.000-5.000'} EUR total
  Referencia RTB: 8 camiones+furgonetas+coches = 56.095 EUR total transportes (30d rodaje)

## REGLA CRITICA PARA CAPITULO 07 — VIAJES, DIETAS Y COMIDAS

Cap 07 MINIMO ${isCorto ? '2-3' : '8-12'} lineas. USA las tarifas de DIETAS.
07.01 DESPLAZAMIENTOS:
  07.01.01 Scouting/busqueda localizaciones: ${isCorto ? '500-1.000' : '2.000-4.000'} EUR
  07.01.02 Localizaciones tecnicas: ${isCorto ? '300-500' : '1.500-3.000'} EUR
  07.01.03 Viajes tecnicos preproduccion: ${isCorto ? '500' : '3.000-5.000'} EUR
  07.01.04 Viajes actores (vuelos/trenes): ${isCorto ? '500-1.000' : '5.000-8.000'} EUR
  07.01.05 Combustible vehiculos: estimado 100-200 EUR/dia rodaje
  07.01.06 Peajes/autopistas: ${isCorto ? '100-300' : '500-1.500'} EUR
07.02 HOTELES Y COMIDAS (SEPARAR actores de tecnicos):
  07.02.01 Hoteles actores: 80-120 EUR/noche x actores desplazados x noches
  07.02.02 Hoteles tecnicos: 60-100 EUR/noche x tecnicos desplazados x noches
  07.02.03 Comidas rodaje (catering set): 15-18 EUR/persona/dia x equipo x dias
  07.02.04 Dietas tecnicos: 55 EUR/dia completa x personas x dias
  07.02.05 Dietas actores: 55 EUR/dia completa x actores x dias
  07.02.06 Comidas figuracion: 10-12 EUR/persona/dia x figurantes x dias
  Referencia RTB: Hotel actores 19.000 + Hotel tecnicos 30.000 + Comidas 36.000 + Dietas 22.000 = 131.820 EUR (30d)

## REGLA CRITICA PARA CAPITULO 08 — SOPORTE DIGITAL

Cap 08 MINIMO ${isCorto ? '2' : '3-4'} lineas.
08.01 SOPORTE:
  08.01.01 Tarjetas CFexpress/SSD rodaje: 150-300 EUR/tarjeta x cantidad
  08.01.02 Discos backup diario: 200-500 EUR/unidad x cantidad
  08.01.03 Almacenamiento NAS/RAID: 2.000-5.000 EUR (largo)
  08.01.04 LTO backup archivo: 80 EUR/cinta x cantidad (largo)

## REGLA CRITICA PARA CAPITULO 09 — POSTPRODUCCION

Cap 09 MINIMO ${isCorto ? '6-8' : '10-14'} lineas. USA LAS TARIFAS REALES de la seccion "TARIFAS POSTPRODUCCION".
NUNCA inventar precios — usa los datos de facturas Antaviana/El Colorado.
09.01 LABORATORIO/ETALONAJE:
  09.01.01 Copiones/dailies: ${isCorto ? '500-1.000' : '2.000-4.000'}
  09.01.02 Etalonaje: ${isCorto ? '500/dia x 3-5 dias = 1.500-2.500' : '1.600/dia x 8-15 dias = 12.800-24.000'}
09.02 EFECTOS DIGITALES Y VARIOS:
  09.02.01 Diseno sonoro: ${isCorto ? '2.000' : '715/dia x 30 dias = 21.450'}
  09.02.02 Edicion dialogos: ${isCorto ? '1.500' : '680/dia x 25 dias = 17.000'}
  09.02.03 Doblaje/ADR: segun necesidad
  09.02.04 Foley: ${isCorto ? '1.000' : '10.000'}
  09.02.05 Mezcla ${isCorto ? 'estereo: 2.000-3.000' : '5.1 Dolby: 12.000'}
  09.02.06 VFX: 300-800/plano simple, 800-2.500/medio, 2.500-8.000/complejo
  09.02.07 Titulos y creditos: ${isCorto ? '800' : '4.600'}
  09.02.08 DCP: 2K 1.500, 4K 2.250
  09.02.09 Subtitulos: transcripcion 4,80/min, traduccion 10,80/min
  09.02.10 Subtitulos accesibilidad: 22/min
  09.02.11 Master UHD/HDR: 800-3.500
  09.02.12 Coordinacion postproduccion: ${isCorto ? '1.500' : '9.000'}

## REGLA CRITICA PARA CAPITULO 10 — SEGUROS

Cap 10 MINIMO ${isCorto ? '3-4' : '4-6'} lineas. CALCULAR como % del presupuesto total produccion.
10.01 SEGUROS PRODUCCION:
  10.01.01 Responsabilidad civil: 0,3% del presupuesto total
  10.01.02 Accidentes trabajo: 0,2% del presupuesto total
  10.01.03 Interrupcion rodaje: 0,5% del presupuesto total
  10.01.04 Seguro equipo/material: 0,8% del valor de equipos alquilados
  ${isCorto ? '' : '10.01.05 Buen fin / Completion bond: 5.000-10.000\n  10.01.06 E&O (errores y omisiones): 2.000-4.000'}

## REGLA CRITICA PARA CAPITULO 11 — GASTOS GENERALES

Cap 11 MINIMO ${isCorto ? '2-3' : '4-6'} lineas.
11.01 GASTOS GENERALES:
  11.01.01 Asesoria juridica: ${isCorto ? '500-1.000' : '5.000-10.000'}
  11.01.02 Asesoria fiscal/contable: ${isCorto ? '300-500' : '3.000-6.000'}
  11.01.03 Auditoria ICAA: ${isCorto ? '1.000' : '3.600'} (tarifa oficial)
  ${isCorto ? '' : '11.01.04 Gastos financieros: 3.000-6.000\n  11.01.05 Gastos notariales/registro: 1.500-3.000'}
11.02 IMPREVISTOS:
  11.02.01 Imprevistos: 10% del subtotal Cap 01-10 (OBLIGATORIO)

## REGLA CRITICA PARA CAPITULO 12 — EXPLOTACION Y PUBLICIDAD

Cap 12 MINIMO ${isCorto ? '3-5' : '6-10'} lineas.
12.01 COPIAS/DISTRIBUCION:
  12.01.01 DCP distribucion: 1.500-2.250 EUR por copia
  12.01.02 Copias festivales: 1-3 copias adicionales
12.02 PUBLICIDAD Y MARKETING (MAXIMO 40% del coste de realizacion):
  12.02.01 Trailer: ${isCorto ? '500-1.000' : '3.000-8.000'}
  12.02.02 Carteleria/diseno grafico: ${isCorto ? '300-800' : '10.000-20.000'}
  12.02.03 Campana marketing/publicidad: ${isCorto ? '500-1.000' : '30.000-80.000'}
  12.02.04 Web + redes sociales: ${isCorto ? '200-500' : '2.000-4.000'}
  12.02.05 Press kit/EPK: ${isCorto ? '200-400' : '1.500-3.000'}
  12.02.06 Fotografia promocional: ${isCorto ? '200-400' : '1.500-3.000'}
  12.02.07 Estreno/premiere: ${isCorto ? '200-500' : '2.000-5.000'}
  12.02.08 Inscripcion festivales: ${isCorto ? '200-500' : '2.000-4.000'}
12.03 INTERESES PASIVOS (MAXIMO 20% del coste de realizacion):
  12.03.01 Intereses pasivos financiacion: ${isCorto ? '0' : '20.000-50.000'} EUR
  Solo si hay financiacion bancaria o lineas de credito para la produccion

## EJEMPLO DE PRESUPUESTO REAL — DESGLOSE DETALLADO

${isCorto ? `Cortometraje ficcion "ED" — 5 dias rodaje, bajo presupuesto, Madrid

Cap 01 Guion y Musica: 6.500 EUR
  01.01.02 Guion original: 5.000 | 01.02.02 Compositor: 1.500

Cap 02 Personal Artistico: 4.200 EUR
  02.01.01 Protagonista (5d x 500): 2.500
  02.03.01 Secundario 1 (2d x 400): 800
  02.03.02 Secundario 2 (1d x 400): 400
  02.05.01 Figuracion: 500

Cap 03 Equipo Tecnico: 26.800 EUR (con SS 23,5%)
  03.01.01 Director/Realizador: 4.713/sem x 2 sem = 9.426
  03.01.02 1er Ayudante Direccion: 2.636/sem x 1 sem = 2.636
  03.02.01 Director Produccion: 3.954/sem x 2 sem = 7.908
  03.02.03 Ayudante Produccion: 1.977/sem x 1 sem = 1.977
  03.03.01 Director Fotografia: 3.954/sem x 2 sem = 7.908
  03.03.03 1er Ayudante Camara: 1.977/sem x 1 sem = 1.977
  03.04.01 Director Arte: 3.954/sem x 1 sem = 3.954
  03.05.01 Figurinista: 2.636/sem x 1 sem = 2.636
  03.06.01 Jefe Maquillaje: 2.636/sem x 1 sem = 2.636
  03.07.01 Jefe Peluqueria: 2.197/sem x 1 sem = 2.197
  03.09.01 Jefe Sonido: 2.636/sem x 1 sem = 2.636
  03.09.02 Microfonista: 1.977/sem x 1 sem = 1.977
  03.10.01 Montador: 2.636/sem x 2 sem = 5.272
  03.11.01 Jefe Electricos: 2.197/sem x 1 sem = 2.197
  03.11.02 Electrico: 1.717/sem x 1 sem = 1.717
  Subtotal bruto: ~57.254 + SS 23,5%: ~13.455 = ~70.709

Cap 04 Escenografia: 3.500 EUR
  04.01.08 Alquiler interiores naturales: 1.500
  04.02.02 Atrezzo alquilado: 800
  04.02.03 Mobiliario adquirido: 500
  04.03.02 Vestuario adquirido: 500
  04.05.02 Material maquillaje: 200

Cap 05 Estudios/Varios Produccion: 2.200 EUR
  05.02.01 Sala montaje (3 sem x 300/sem): 900
  05.03.05 Catering rodaje (5d x 15 pers x 12€): 900
  05.03.04 Material consumible/oficina: 400

Cap 06 Maquinaria y Transportes: 5.100 EUR
  06.01.01 Camara pack (Blackmagic URSA): 120/dia x 5d = 600
  06.01.03 Optica (zoom cine): 100/dia x 5d = 500
  06.01.05 Kit iluminacion basico: 80/dia x 5d = 400
  06.01.06 Kit sonido directo: 150/dia x 5d = 750
  06.01.07 Dolly: 120/dia x 3d = 360
  06.01.12 Material expendable: 300
  06.02.02 Furgoneta produccion: 80/dia x 6d = 480
  06.02.04 Vehiculo actores: 60/dia x 5d = 300

Cap 07 Viajes/Dietas: 4.200 EUR
  07.02.02 Dietas equipo (12 pers x 5d x 55€): 3.300
  07.02.03 Catering set complemento: 900

Cap 08 Soporte Digital: 800 EUR
  08.01.01 Tarjetas CFexpress/SSD: 500
  08.01.02 Discos backup diario: 300

Cap 09 Postproduccion: 13.200 EUR
  09.01.02 Etalonaje (500/dia x 3d): 1.500
  09.02.01 Diseno sonoro: 2.000
  09.02.02 Edicion dialogos: 1.500
  09.02.04 Foley: 1.000
  09.02.05 Mezcla estereo: 2.000
  09.02.06 VFX (5 planos simples x 500): 2.500
  09.02.07 Titulos y creditos: 800
  09.02.08 DCP 2K: 1.500
  09.02.12 Coordinacion postpro: 400

Cap 10 Seguros: 1.200 EUR
  10.01.01 Responsabilidad civil (0,3%): 300
  10.01.02 Accidentes trabajo (0,2%): 200
  10.01.03 Interrupcion rodaje (0,5%): 400
  10.01.04 Equipo/material: 300

Cap 11 Gastos Generales: 7.800 EUR
  11.01.01 Asesoria juridica: 500
  11.01.03 Auditoria ICAA: 1.500
  11.01.06 Imprevistos (10%): 5.800

Cap 12 Explotacion/Publicidad: 2.300 EUR
  12.01.01 DCP distribucion festivales: 800
  12.02.01 Trailer: 500
  12.02.02 Carteleria/diseno: 500
  12.02.04 Press kit: 300
  12.02.05 Inscripcion festivales: 200

TOTAL: ~71.000 EUR` : `Largometraje ficcion "RTB" — 30 dias rodaje, presupuesto estandar, 4K
DATOS REALES de produccion verificada (Formulario 601 ICAA)

Cap 01 Guion y Musica: 75.000 EUR
  01.01.02 Guion original: 30.000
  01.02.01 Derechos musicales canciones: 15.000
  01.02.02 Compositor BSO: 30.000

Cap 02 Personal Artistico: 130.112 EUR
  02.01.01 Protagonista (30d x 1.667): 50.000
  02.02.01 Principal "Luna" (20d x 1.000): 20.000
  02.02.02 Principal "Amiga" (15d x 1.000): 15.000
  02.03.01-16 Secundarios (16 actores x 2d x 1.000): 32.000
  02.05.01 Figuracion batalla final (120 fig x 3d x 40€): 14.400
  02.05.02 Figuracion general (15 fig x 8d x 40€): 4.712
  02.06.01 Doble Especialista: 2.000
  SS empresa 23,5% sobre bruto: ya incluida en cada linea

Cap 03 Equipo Tecnico: 492.245 EUR (DATOS REALES RTB con SS 23,5%)
  03.01 DIRECCION:
    03.01.01 Director/Realizador: 50.000 (14 sem)
    03.01.02 1er Ayudante Direccion: 12.320 (4 sem)
    03.01.03 2o Ayudante Direccion: 7.360 (3 sem)
    03.01.04 Script/Continuidad: 5.890 (2 sem)
    03.01.05 Director de Reparto/Casting: 10.000
  03.02 PRODUCCION:
    03.02.01 Produccion ejecutiva: 60.000 (max 5% coste realizacion = 69.306)
    03.02.02 Director Produccion: 30.400 (8 sem)
    03.02.03 Jefe Produccion: 12.375 (5 sem)
    03.02.04 1er Ayudante Produccion: 9.500 (5 sem)
    03.02.05 2o Ayudante Produccion: 7.140 (5 sem)
    03.02.06 Auxiliares Produccion x6: 19.050 (5 sem x 635/sem c/u)
    03.02.09 Localizador: 5.000
  03.03 FOTOGRAFIA:
    03.03.01 Director Fotografia: 17.500 (5 sem)
    03.03.03 Foquista/1er Ayte Camara: 6.380 (4 sem)
    03.03.04 Auxiliar Camara: 4.640 (4 sem)
    03.03.06 DIT: 4.640 (4 sem)
    03.03.07 Video Assist: 3.190 (4 sem)
  03.04 DECORACION:
    03.04.01 Director Arte: 12.320 (4 sem)
    03.04.02 Ayudante Decoracion: 9.360 (4 sem)
    03.04.04 Regidor: 7.680 (4 sem)
    03.04.05 Ayte Atrezzo 1: 4.760 (4 sem)
    03.04.06 Ayte Atrezzo 2: 2.380 (2 sem)
  03.05 VESTUARIO:
    03.05.01 Figurinista: 12.320 (4 sem)
    03.05.02 Ayudante Vestuario 1: 10.080 (6 sem)
    03.05.03 Ayudante Vestuario 2: 4.760 (4 sem)
  03.06 MAQUILLAJE:
    03.06.01 Jefa Maquillaje: 12.880 (4 sem x 3.220/sem)
    03.06.02 Ayudante Maquillaje: 7.200 (4 sem)
  03.07 PELUQUERIA:
    03.07.01 Jefa Peluqueria: 12.880 (4 sem)
    03.07.02 Ayudante Peluqueria: 7.200 (4 sem)
  03.08 EFECTOS ESPECIALES:
    03.08.01 EFX mecanicos/SFX set: 5.000
  03.09 SONIDO:
    03.09.01 Jefe Sonido: 9.000 (3 sem x 3.000/sem)
    03.09.02 Microfonista 1: 5.000 (4 sem)
    03.09.03 Microfonista 2: 5.000 (4 sem)
  03.10 MONTAJE:
    03.10.01 Montador: 12.000 (5 sem)
    03.10.02 Ayudante Montaje: 9.600 (4 sem)
  03.11 ELECTRICOS/MAQUINISTAS:
    03.11.01 Jefe Electricistas: 10.500 (3 sem)
    03.11.02 Electrico 1: 6.400 (4 sem)
    03.11.03 Electricos 2-4 (x3): 18.000 (4 sem x 1.500/sem c/u)
    03.11.05 Jefe Maquinistas: 5.940 (3 sem)
    03.11.06 Ayudante Maquinista: 4.860 (3 sem)
  03.12 COMPLEMENTARIO:
    03.12.01 Guardas/vigilancia (x4): 4.800 (30d x 40/dia c/u)
  03.14 HORAS EXTRAS: 9.350 (~6% del bruto)
  03.15 SABADOS/FESTIVOS: 22.440 (5 sabados x recargo)
  Subtotal bruto Cap 03: 492.245 (incluye SS 23,5%)

Cap 04 Escenografia: 119.850 EUR (DATOS REALES RTB)
  04.01 DECORADOS:
    04.01.03 Construccion exteriores: 10.000
    04.01.04 Construccion interiores: 10.000
    04.01.08 Alquiler interiores naturales: 18.000
  04.02 AMBIENTACION:
    04.02.01 Mobiliario alquilado: 8.000
    04.02.02 Atrezzo alquilado: 6.000
    04.02.03 Mobiliario adquirido: 2.000
    04.02.04 Atrezzo adquirido: 5.000
    04.02.09 Material EFX maquillaje protesico: 10.000
  04.03 VESTUARIO:
    04.03.01 Vestuario alquilado: 36.000 (pelicula de epoca/fantasia)
    04.03.02 Vestuario adquirido: 8.850
    04.03.04 Complementos: 4.000
  04.04 SEMOVIENTES:
    04.04.01 Animales: 2.000

Cap 05 Estudios/Varios Produccion: 103.390 EUR (DATOS REALES RTB)
  05.02.01 Sala montaje: 3.000
  05.02.02 Sala efectos sonoros: 30.000
  05.03.01 Oficina exteriores produccion: 24.500
  05.03.06 PRL (Prevencion Riesgos Laborales): 590 (OBLIGATORIO)
  05.03.07 Gestoria/contabilidad: 12.500
  05.03.08 Asesoria juridica produccion: 15.000
  05.03.05 Catering rodaje: 17.800

Cap 06 Maquinaria y Transportes: 178.265 EUR (DATOS REALES RTB)
  06.01 MAQUINARIA:
    06.01.01 Pack camara principal (4K): 45.000 (30d alquiler pack completo)
    06.01.05 Kit iluminacion: 20.000 (30d)
    06.01.06 Kit sonido directo: 6.550 (30d)
    06.01.07 Grip/maquinistas: 8.000 (30d)
    06.01.09 Steadicam + operador: 8.000 (10d x 800/dia)
    06.01.11 Grupo electrogeno alquiler: 11.500 (30d)
    06.01.13 Combustible generador: 4.950 (30d x 165/dia)
    06.01.14 DIT Station/monitor: 6.000
    06.01.10 Dron + piloto: 3.000 (3d x 1.000)
  06.02 TRANSPORTES (flota real):
    06.02.01 Coches produccion (x2): 7.000 (35d x 100/dia)
    06.02.05 Furgonetas (x3): 14.415 (35d x ~137/dia)
    06.02.02 Camion camara: 9.000 (30d x 300/dia)
    06.02.03 Camion vestuario: 9.000 (30d x 300/dia)
    06.02.01b Camion iluminacion: 12.695 (30d x 423/dia)
    06.02.04 Camion maquinista: 4.000 (20d x 200/dia)
    06.02.09 Gasolina flota: 4.400
    06.02.10 Parking rodaje: 4.755

Cap 07 Viajes/Dietas: 131.820 EUR (DATOS REALES RTB)
  07.01.01 Scouting localizaciones: 3.000
  07.01.02 Localizaciones tecnicas: 2.000
  07.01.03 Viajes tecnicos preproduccion: 4.000
  07.01.04 Viajes actores: 6.880
  07.02.01 Hotel actores (protagonistas/principales): 19.000
  07.02.02 Hotel tecnicos desplazados: 30.000
  07.02.03 Comidas rodaje equipo (30 pers x 30d x 40€): 36.000
  07.02.04 Dietas tecnicos: 18.000
  07.02.05 Dietas actores: 4.000
  07.02.06 Comidas figuracion (batalla): 5.940
  07.02.07 Gastos extras manutenc: 3.000

Cap 08 Soporte Digital: 4.000 EUR
  08.01.02 Discos DIT/backup diario: 4.000

Cap 09 Postproduccion: 78.000 EUR (DATOS REALES RTB)
  09.02.06 VFX: 20.000
  09.02.13 Laboratorio digital (etalonaje + dailies + master): 50.000
  09.02.07 Titulos credito: 5.000
  09.02.09 Subtitulado: 3.000

Cap 10 Seguros: 73.432 EUR (DATOS REALES RTB)
  10.01.01 Responsabilidad civil: 8.000
  10.02.01 Seguridad Social complementaria: 65.432 (23,5% sobre masa salarial)

Cap 11 Gastos Generales: 88.000 EUR (max 7% coste realizacion = 97.028)
  11.01.01 Oficina produccion: 18.600
  11.01.02 Personal administrativo: 20.000
  11.01.03 Suministros/servicios: 20.000
  11.01.04 Asesorias/auditorias: 10.000
  11.01.05 Gastos varios: 19.400

Cap 12 Explotacion/Publicidad: 158.390 EUR
  12.01.01 Copias DCP distribucion: 13.390
  12.02.01 Diseno grafico/carteleria: 15.000
  12.02.02 Campana marketing/publicidad: 80.000
  12.03.01 Intereses pasivos: 50.000 (max 20% coste realizacion)

COSTE DE REALIZACION (Cap 01-10): 1.386.114 EUR
TOTAL PRESUPUESTO: 1.692.504 EUR

VERIFICACION LIMITES ICAA:
  Prod.ejecutiva 60.000 < max 69.306 (5%) OK
  Gastos generales 88.000 < max 97.028 (7%) OK
  Publicidad 95.000 < max 554.446 (40%) OK
  Intereses pasivos 50.000 < max 277.223 (20%) OK`}

## FORMATO DE RESPUESTA

Responde EXCLUSIVAMENTE con JSON valido. Sin texto antes ni despues. Sin markdown fences.
La respuesta debe comenzar con { y terminar con }.

{
  "budgetLines": [
    {
      "chapter": 1,
      "account_number": "01.01.02",
      "concept": "Guion original",
      "units": 1,
      "quantity": 1,
      "unit_price": 15000,
      "agency_percentage": 0,
      "social_security_percentage": 0,
      "vat_percentage": 21,
      "tariff_source": "Convenio DAMA 2025",
      "notes": "Guionista con experiencia media",
      "budget_level": "${budgetLevel}"
    }
  ],
  "summary": {
    "totalShootingDays": 30,
    "prepDays": 15,
    "postWeeks": 12,
    "totalBudget": 1200000,
    "warnings": ["El presupuesto de VFX es estimado; solicitar presupuesto detallado a proveedor"],
    "recommendations": ["Considerar coproduccion para acceder a fondos adicionales"]
  }
}

REGLAS:
- Usa SIEMPRE codigos CC.SS del ICAA (ej: "03.01.01" para Director)
- Aplica tarifas del Convenio Colectivo para todo el personal tecnico
- Incluye social_security_percentage (23.5) para TODAS las partidas de personal
- units = numero de personas, quantity = semanas/dias de contrato, unit_price = tarifa semanal/diaria
- Genera MINIMO ${isCorto ? '35' : '80'} partidas detalladas cubriendo TODOS los 12 capitulos
- El total debe ser coherente con los rangos tipicos del tipo de proyecto
- Incluye notas justificativas para partidas significativas
- SIEMPRE incluir partidas de Horas Extras (03.14) y Sabados (03.15) en Cap 03
- SIEMPRE incluir PRL en Cap 05 (obligatorio por ley)
- VERIFICAR que Prod.Ejecutiva < 5%, Gastos Generales < 7%, Publicidad < 40%, Intereses < 20% del coste de realizacion
- El Coste de Realizacion = suma Cap 01-10 (SIN Cap 11-12)
- Si alguna partida excede su limite ICAA, incluir un warning en la respuesta`;
}

// ── Handler ─────────────────────────────────────────────────────────

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let requestData: Record<string, unknown>;
  try {
    requestData = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'JSON invalido en la solicitud' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const projectType = (requestData.projectType as string) || 'largometraje';
  const budgetLevel = (requestData.budgetLevel as string) || 'medio';

  const systemPrompt = buildSystemPrompt(projectType, budgetLevel);

  const userPrompt = `Genera un presupuesto ICAA completo y detallado para el siguiente proyecto:

TIPO: ${projectType}
NIVEL: ${budgetLevel}
DIAS DE RODAJE ESTIMADOS: ${requestData.estimatedShootingDays || 'a determinar por ti segun los datos'}

PERSONAJES (${Array.isArray(requestData.characters) ? requestData.characters.length : 0}):
${(Array.isArray(requestData.characters) ? requestData.characters as Array<{ name: string; category: string; shootingDays?: number; agencyPercentage?: number }> : []).map(c =>
  `- ${c.name} (${c.category}, ${c.shootingDays || '?'} dias rodaje, agencia: ${c.agencyPercentage || 0}%)`
).join('\n')}

LOCALIZACIONES (${Array.isArray(requestData.locations) ? requestData.locations.length : 0}):
${(Array.isArray(requestData.locations) ? requestData.locations as Array<{ name: string; complexity: string; estimatedDays?: number; locationType?: string }> : []).map(l =>
  `- ${l.name} (complejidad: ${l.complexity}, ${l.estimatedDays || '?'} dias, tipo: ${l.locationType || 'no especificado'})`
).join('\n')}

SECUENCIAS (${Array.isArray(requestData.sequences) ? requestData.sequences.length : 0}):
${(Array.isArray(requestData.sequences) ? requestData.sequences as Array<{ sequenceNumber: number; title: string; sceneComplexity?: string; hasVFX: boolean; hasAction: boolean; hasNight: boolean }> : []).map(s =>
  `- Sec ${s.sequenceNumber}: ${s.title} (complejidad: ${s.sceneComplexity || 'media'}${s.hasVFX ? ', VFX' : ''}${s.hasAction ? ', accion' : ''}${s.hasNight ? ', noche' : ''})`
).join('\n')}

${(requestData.creativeAnalysis as Record<string, unknown>) ? `ANALISIS CREATIVO:
Sinopsis: ${(requestData.creativeAnalysis as Record<string, unknown>).synopsis || 'N/A'}
Puntuacion producibilidad: ${(requestData.creativeAnalysis as Record<string, unknown>).producibilityScore || 'N/A'}
Rango presupuesto estimado: ${(requestData.creativeAnalysis as Record<string, unknown>).estimatedBudgetRange || 'N/A'}
Factores positivos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsPositive as string[] || []).join(', ')}
Factores negativos: ${((requestData.creativeAnalysis as Record<string, unknown>).viabilityFactorsNegative as string[] || []).join(', ')}` : ''}

INSTRUCCIONES:
- Aplica las tarifas del Convenio Colectivo para todo el personal tecnico
- Usa precios de mercado reales para equipamiento y postproduccion
- Incluye SS empresa 23,5% para todo el personal
- Genera partidas detalladas para TODOS los 12 capitulos
- Responde SOLO con JSON valido, sin texto adicional`;

  // Stream from Anthropic with stream:true
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 64000,
      temperature: 0.2,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text().catch(() => '');
    let errorMsg = `Error HTTP ${anthropicResponse.status}`;
    try { errorMsg = JSON.parse(errorText).error?.message || errorMsg; } catch { /* keep default */ }

    return new Response(
      JSON.stringify({ error: `Error de la API: ${errorMsg}` }),
      { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Accumulate ALL text server-side, send ONE complete event to avoid browser SSE data loss
  const reader = anthropicResponse.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';
      let fullText = '';

      // Heartbeat every 5s to keep Vercel/browser connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', length: fullText.length })}\n\n`)
          );
        } catch { clearInterval(heartbeat); }
      }, 5000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]' || data === '') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullText += parsed.delta.text;
                } else if (parsed.type === 'error') {
                  clearInterval(heartbeat);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', error: parsed.error?.message || 'Error' })}\n\n`)
                  );
                }
              } catch {
                // Ignore unparseable SSE lines
              }
            }
          }
        }

        clearInterval(heartbeat);

        // Send ALL accumulated text in ONE event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', text: fullText })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
      } catch (err) {
        clearInterval(heartbeat);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'Error en el stream' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
