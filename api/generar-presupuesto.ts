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

## REGLAS DE CALCULO OBLIGATORIAS

- Seguridad Social empresa: 23,5% sobre remuneracion bruta (Cap 10.02 o incluido en Cap 03)
- IRPF retencion: 15% general, 19% para ingresos >60.000 EUR/anual
- Dietas: 55 EUR/dia completa (personal desplazado), 15 EUR media dieta
- Seguros: RC ~0,3% presupuesto, Accidentes ~0,2%, Interrupcion ~0,5%, Equipo ~0,8%
- Gastos generales: ~5% del presupuesto de produccion (Cap 01-10)
- Imprevistos: ~10% (incluir en Cap 11)

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
  : 'Director Fotografia, Operador Camara, 1er Ayudante Camara, 2o Ayudante Camara, Foquista, DIT, Foto Fija'}
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
  : 'Asistencia Sanitaria, Peones/Cargadores'}
03.13 SEGUNDA UNIDAD: ${isCorto
  ? '(no aplica)'
  : '(si el proyecto lo requiere)'}

## REGLA CRITICA PARA CAPITULO 04 — ESCENOGRAFIA

Cap 04 tiene 5 subsecciones obligatorias:
04.01 DECORADOS: Construccion/montaje plato, Construccion exteriores, Construccion interiores naturales, Alquiler interiores naturales
04.02 AMBIENTACION: Mobiliario alquilado, Atrezzo alquilado, Mobiliario adquirido, Atrezzo adquirido, Vehiculos escena, Comidas escena, Material EFX
04.03 VESTUARIO: Vestuario alquilado, Vestuario adquirido, Zapateria, Complementos, Materiales sastreria
04.04 SEMOVIENTES: Animales, Carruajes (si aplica)
04.05 VARIOS: Material peluqueria, Material maquillaje

## REGLA CRITICA PARA CAPITULOS 05-12

Cada capitulo DEBE tener lineas individuales con cuenta CC.SS, concepto, y calculo.
NUNCA poner un capitulo como una sola linea resumen.

Cap 05 ESTUDIOS/VARIOS PRODUCCION:
  05.01 Estudios rodaje: Plato/estudio (tarifa/dia x dias), montaje/desmontaje plato
  05.02 Montaje/sonorizacion: Sala montaje (sem), sala mezclas
  05.03 Varios produccion: Catering rodaje (personas x dias x 12-15€), oficina produccion, material consumible, copias guion

Cap 06 MAQUINARIA Y TRANSPORTES — CALCULAR: tarifa/dia x dias rodaje
  06.01 Maquinaria: Camara pack (120-450/dia segun nivel), optica (100-300/dia), iluminacion (80-450/dia), sonido directo (150/dia), dolly (120/dia), grua (200/dia si aplica), steadicam (300/dia), drone+piloto (600/dia), generador (200/dia exterior), material expendable
  06.02 Transportes: Camion iluminacion (150/dia), furgonetas produccion (80/dia x numero), furgoneta atrezzo, vehiculos actores

Cap 07 VIAJES/DIETAS — CALCULAR: segun equipo desplazado
  07.01 Desplazamientos: Billetes avion/tren, combustible, peajes
  07.02 Hoteles/comidas: Hoteles (personas x dias x 80€), dietas (55€/dia x personas x dias)

Cap 08 SOPORTE DIGITAL:
  08.01 Tarjetas CFexpress/SSD, discos backup diario, almacenamiento NAS/RAID, LTO archivo

Cap 09 POSTPRODUCCION — USAR TARIFAS REALES de la seccion anterior:
  09.01 Etalonaje (1.600/dia largo, 500/dia corto), copiones/dailies
  09.02 Diseno sonoro (715/dia), edicion dialogos (680/dia), foley, mezcla 5.1, VFX (300-8.000/plano segun complejidad), titulos/creditos, DCP (1.500-2.250), subtitulos, coordinacion postpro, master UHD

Cap 10 SEGUROS — CALCULAR como % del presupuesto:
  10.01.01 RC: 0,3% del total | 10.01.02 Accidentes: 0,2% | 10.01.03 Interrupcion rodaje: 0,5% | 10.01.04 Equipo/material: 0,8% valor equipos

Cap 11 GASTOS GENERALES:
  11.01 Asesoria juridica, asesoria fiscal, auditoria ICAA (1.500 corto, 3.500 largo), gastos financieros
  11.02 Imprevistos: 10% del subtotal Cap 01-10

Cap 12 EXPLOTACION/PUBLICIDAD:
  12.01 Copias: DCP distribucion, copias festivales
  12.02 Publicidad: Trailer, carteleria, web, press kit, estreno

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

TOTAL: ~71.000 EUR` : `Largometraje ficcion "LMDS" — 30 dias rodaje, presupuesto medio

Cap 01 Guion y Musica: 25.000 EUR
  01.01.02 Guion original: 18.000 | 01.02.02 Compositor: 7.000

Cap 02 Personal Artistico: 85.000 EUR
  02.01.01 Protagonista 1 (28d x 2.500): 70.000
  02.01.02 Protagonista 2 (25d x 2.500): 62.500 (ajustar)
  02.03.01-03 Secundarios (3 pers): 8.000
  02.05.01 Figuracion: 2.000

Cap 03 Equipo Tecnico: 461.943 EUR bruto + 117.524 SS (DESGLOSE REAL LMDS)
  03.01 DIRECCION:
    03.01.01 Director/Realizador: 50.000 (14 sem)
    03.01.02 1er Ayudante Direccion: 10.000 (4 sem)
    03.01.03 Script/Continuidad: 5.030 (2 sem)
    03.01.04 2o Ayudante Direccion: 2.534 (1 sem)
    03.01.05 Director de Reparto: 10.000
    03.01.07 Auxiliar Direccion: 2.345 (1 sem)
  03.02 PRODUCCION:
    03.02.01 Productor Ejecutivo: 59.000 (14 sem)
    03.02.02 Director Produccion: 47.000 (12 sem)
    03.02.03 Jefe Produccion: 31.640 (10 sem)
    03.02.04 1er Ayudante Produccion: 21.866 (9 sem)
    03.02.05 2o Ayudante Produccion: 16.820 (8 sem)
    03.02.06 Auxiliares Produccion x3: 46.230 (8 sem c/u)
    03.02.07 Cajero-Pagador: 25.088 (10 sem)
    03.02.08 Secretaria Produccion: 17.898 (8 sem)
    03.02.09 Localizador: 17.892 (8 sem)
  03.03 FOTOGRAFIA:
    03.03.01 Director Fotografia: 22.500 (6 sem)
    03.03.02 Operador Camara/2o Operador: 5.100 (2 sem)
    03.03.04 Ayudantes Camara x2: 9.100 (3 sem c/u)
    03.03.06 DIT: 6.250 (2.5 sem)
    03.03.07 Auxiliar Camara: 2.550 (1 sem)
  03.04 DECORACION:
    03.04.01 Decorador/Director Arte: 19.000 (5 sem)
    03.04.02 Ayudante Decoracion: 5.800 (3 sem)
    03.04.03 Ambientador: 5.000 (2 sem)
    03.04.04 Atrecista: 4.000 (2 sem)
    03.04.05 Auxiliar Atrezzo Rodaje: 3.500 (2 sem)
    03.04.06 Auxiliar Atrezzo Montaje: 3.500 (2 sem)
  03.05 VESTUARIO:
    03.05.01 Figurinista: 16.500 (5 sem)
    03.05.02 Jefe Sastreria: 11.000 (5 sem)
    03.05.03 Sastra: 5.000 (2 sem)
  03.06 MAQUILLAJE:
    03.06.01 Jefe Maquillaje: 6.547 (2.5 sem)
    03.06.02 Ayudante Maquillaje: 5.076 (2.5 sem)
  03.07 PELUQUERIA:
    03.07.01 Jefe Peluqueria: 6.545 (2.5 sem)
    03.07.02 Ayudante Peluqueria: 5.076 (2.5 sem)
  03.08 EFECTOS ESPECIALES:
    03.08.01 Jefe EFX Mecanicos: 2.100 (1 sem)
  03.09 SONIDO:
    03.09.01 Jefe Sonido: 5.500 (2 sem)
    03.09.02 Ayudante Sonido: 3.200 (1.5 sem)
    03.09.03 Refuerzos Sonido: 1.000
  03.10 MONTAJE:
    03.10.01 Montador: 12.000 (5 sem)
    03.10.02 Ayudante Montaje: 8.400 (4 sem)
  03.11 ELECTRICOS/MAQUINISTAS:
    03.11.01 Jefe Electricistas: 4.000 (2 sem)
    03.11.02 Electricistas x2: 8.640 (2 sem c/u)
  03.12 PERSONAL COMPLEMENTARIO:
    03.12.01 Asistencia Sanitaria: 2.500
    03.12.03 Peones/Cargadores: 1.750
  Subtotal bruto Cap 03: 461.943 + SS 23,5%: 117.524 + Dietas: 19.130

Cap 04 Escenografia: 115.500 EUR (DESGLOSE REAL LMDS)
  04.01 DECORADOS:
    04.01.01 Construccion/montaje decorados plato: 50.000
    04.01.03 Construccion exteriores: 5.000
    04.01.04 Construccion interiores naturales: 5.000
    04.01.08 Alquiler interiores naturales: 15.000
  04.02 AMBIENTACION:
    04.02.01 Mobiliario alquilado: 15.000
    04.02.02 Atrezzo alquilado: 5.000
    04.02.03 Mobiliario adquirido: 4.000
    04.02.04 Atrezzo adquirido: 4.000
    04.02.05 Jardineria: 1.000
    04.02.07 Vehiculos en escena: 2.500
    04.02.08 Comidas en escena: 1.000
    04.02.09 Material efectos especiales: 5.000
  04.03 VESTUARIO:
    04.03.01 Vestuario alquilado: 5.000
    04.03.02 Vestuario adquirido: 15.000
    04.03.03 Zapateria: 3.000
    04.03.04 Complementos: 5.000
  04.05 VARIOS:
    04.05.01 Material peluqueria: 1.500
    04.05.02 Material maquillaje: 1.500

Cap 05 Estudios/Varios Produccion: 135.000 EUR
  05.01.01 Alquiler plato/estudio (30d x 3.000/dia): 90.000
  05.01.02 Montaje/desmontaje plato: 5.000
  05.02.01 Sala montaje (20 sem x 500/sem): 10.000
  05.02.02 Sala mezclas 5.1 (3 sem x 3.000/sem): 9.000
  05.03.01 Oficina produccion (6 meses x 2.000): 12.000
  05.03.02 Telefonos/comunicaciones: 3.000
  05.03.04 Material oficina/consumible: 1.500
  05.03.05 Catering rodaje (35 pers x 30d x 13€): 13.650

Cap 06 Maquinaria y Transportes: 102.000 EUR
  06.01.01 Camara principal ARRI Alexa Mini pack: 450/dia x 35d = 15.750
  06.01.02 2a camara RED V-Raptor: 400/dia x 15d = 6.000
  06.01.03 Optica primos master: 300/dia x 35d = 10.500
  06.01.04 Zoom cine complementario: 100/dia x 35d = 3.500
  06.01.05 Kit iluminacion avanzado: 450/dia x 30d = 13.500
  06.01.06 Kit sonido directo: 150/dia x 30d = 4.500
  06.01.07 Dolly + via: 120/dia x 30d = 3.600
  06.01.08 Grua: 200/dia x 8d = 1.600
  06.01.09 Steadicam: 300/dia x 10d = 3.000
  06.01.10 Drone + piloto: 600/dia x 3d = 1.800
  06.01.11 Grupo electrogeno: 200/dia x 20d = 4.000
  06.01.12 Material expendable: 5.000
  06.02.01 Camion iluminacion/grip: 150/dia x 35d = 5.250
  06.02.02 Furgonetas produccion (x3): 80/dia x 3 x 35d = 8.400
  06.02.03 Furgoneta atrezzo: 100/dia x 35d = 3.500
  06.02.04 Vehiculos actores (x2): 60/dia x 2 x 30d = 3.600

Cap 07 Viajes/Dietas: 88.000 EUR
  07.01.01 Billetes avion/tren equipo: 8.000
  07.01.02 Combustible vehiculos: 30d x 150/dia = 4.500
  07.01.03 Peajes/autopistas: 1.500
  07.02.01 Hoteles equipo desplazado (10 pers x 25d x 80€): 20.000
  07.02.02 Dietas equipo (30 pers x 30d x 55€): 49.500
  07.02.03 Catering set complemento: 4.500

Cap 08 Soporte Digital: 8.000 EUR
  08.01.01 Tarjetas CFexpress/SSD rodaje: 2.000
  08.01.02 Discos backup diario: 1.500
  08.01.03 Almacenamiento NAS/RAID: 3.000
  08.01.04 LTO backup archivo: 1.500

Cap 09 Postproduccion: 155.000 EUR
  09.01.01 Copiones/dailies: 3.000
  09.01.02 Etalonaje HDR (1.600/dia x 10d): 16.000
  09.02.01 Diseno sonoro (715/dia x 30d): 21.450
  09.02.02 Edicion dialogos (680/dia x 25d): 17.000
  09.02.03 Doblaje/ADR: 5.000
  09.02.04 Foley: 10.000
  09.02.05 Mezcla 5.1 Dolby: 12.000
  09.02.06 VFX (30 planos medios x 1.500): 45.000
  09.02.07 Titulos y creditos: 4.600
  09.02.08 DCP 4K: 2.250
  09.02.09 Subtitulos (90min x 10,80/min): 972
  09.02.10 Subtitulos accesibilidad (90min x 22/min): 1.980
  09.02.11 Master UHD/HDR: 3.500
  09.02.12 Coordinacion postproduccion: 9.000

Cap 10 Seguros: 28.000 EUR
  10.01.01 Responsabilidad civil (0,3% ppto): 4.200
  10.01.02 Accidentes trabajo (0,2%): 2.800
  10.01.03 Interrupcion rodaje (0,5%): 7.000
  10.01.04 Seguro equipo/material (0,8% valor equipos): 3.000
  10.01.05 Buen fin/completion bond: 8.000
  10.01.06 E&O (errores y omisiones): 3.000

Cap 11 Gastos Generales: 155.000 EUR
  11.01.01 Asesoria juridica: 8.000
  11.01.02 Asesoria fiscal/contable: 5.000
  11.01.03 Auditoria ICAA: 3.500
  11.01.04 Gastos financieros: 5.000
  11.01.05 Gastos notariales/registro: 2.500
  11.01.06 Imprevistos (10% Cap 01-10): 131.000

Cap 12 Explotacion/Publicidad: 32.000 EUR
  12.01.01 DCP distribucion (x3 copias): 6.750
  12.01.02 Copias festivales: 3.000
  12.02.01 Trailer: 5.000
  12.02.02 Carteleria/diseno grafico: 4.000
  12.02.03 Web + redes sociales: 3.000
  12.02.04 Press kit/EPK: 2.000
  12.02.05 Fotografia promocional: 2.000
  12.02.06 Estreno/premiere: 3.250
  12.02.07 Inscripcion festivales: 3.000

TOTAL APROXIMADO: ~1.500.000 EUR`}

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
- Genera MINIMO ${isCorto ? '25' : '60'} partidas detalladas cubriendo TODOS los capitulos
- El total debe ser coherente con los rangos tipicos del tipo de proyecto
- Incluye notas justificativas para partidas significativas`;
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

PERSONAJES (${(requestData.characters as unknown[])?.length || 0}):
${((requestData.characters as Array<{ name: string; category: string; shootingDays?: number; agencyPercentage?: number }>) || []).map(c =>
  `- ${c.name} (${c.category}, ${c.shootingDays || '?'} dias rodaje, agencia: ${c.agencyPercentage || 0}%)`
).join('\n')}

LOCALIZACIONES (${(requestData.locations as unknown[])?.length || 0}):
${((requestData.locations as Array<{ name: string; complexity: string; estimatedDays?: number; locationType?: string }>) || []).map(l =>
  `- ${l.name} (complejidad: ${l.complexity}, ${l.estimatedDays || '?'} dias, tipo: ${l.locationType || 'no especificado'})`
).join('\n')}

SECUENCIAS (${(requestData.sequences as unknown[])?.length || 0}):
${((requestData.sequences as Array<{ sequenceNumber: number; title: string; sceneComplexity?: string; hasVFX: boolean; hasAction: boolean; hasNight: boolean }>) || []).map(s =>
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
      max_tokens: 16000,
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

  // Stream SSE deltas TO the client to keep Vercel connection alive
  const reader = anthropicResponse.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';

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
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`)
                  );
                } else if (parsed.type === 'message_stop') {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                  );
                } else if (parsed.type === 'error') {
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
      } catch (err) {
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
