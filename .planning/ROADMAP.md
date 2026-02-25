# Roadmap — Fractal Kit

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Producción Inteligente | Generar presupuesto, plan de rodaje y dossier automáticamente desde el análisis del guión | PROD-01 → PROD-06 | 6 |
| 2 | Distribución + Festivales | Conectar el análisis del guión con el circuito de festivales y convocatorias | DIST-01 → DIST-06 | 5 |
| 3 | Audiencias + Financiación | Conectar análisis narrativo con perfiles de audiencia y construir herramientas de financiación | AUD-01 → AUD-03, FIN-01 → FIN-05 | 5 |

**3 phases** | **20 requirements** | All v1 requirements covered ✓

---

## Phase 1: Producción Inteligente

**Goal:** Que un productor pueda subir su guión y obtener automáticamente un presupuesto ICAA, un plan de rodaje optimizado y un dossier de producción exportable — todo derivado del análisis de IA ya existente.

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06

**Dependencies:** Fase 1 (análisis narrativo) completada ✓ — todos los datos de desglose están disponibles.

**Success Criteria:**
1. Usuario genera presupuesto ICAA desde el análisis con partidas auto-calculadas
2. Plan de rodaje agrupa escenas inteligentemente y se puede ajustar manualmente
3. Memoria de producción se genera como documento profesional
4. Dossier completo se exporta a Excel/PDF con formato estándar de la industria
5. Localizaciones del guión se pueden vincular a lugares físicos reales con mapa
6. Sistema registra datos reales vs estimados para mejorar futuras predicciones

---

## Phase 2: Distribución + Festivales

**Goal:** Que un productor pueda descubrir los festivales y convocatorias más relevantes para su proyecto, basándose en el análisis DAFO y el perfil narrativo del guión, y gestionar sus submissions.

**Requirements:** DIST-01, DIST-02, DIST-03, DIST-04, DIST-05, DIST-06

**Dependencies:**
- Fase 1 completada (análisis narrativo) ✓
- Base de datos de festivales debe poblarse (ICAA publica listado oficial)

**Success Criteria:**
1. Base de datos de festivales españoles con al menos 50 festivales clase A + ICAA
2. IA recomienda festivales relevantes basándose en género, temática, DAFO del guión
3. Calendario muestra deadlines próximos con alertas
4. Usuario puede trackear estado de submissions (enviado/seleccionado/rechazado)
5. Laboratorios y residencias se muestran como oportunidades de desarrollo

---

## Phase 3: Audiencias + Financiación

**Goal:** Cerrar el ciclo conectando el análisis narrativo con perfiles de audiencia detallados y herramientas de planificación financiera que soporten la toma de decisiones del productor.

**Requirements:** AUD-01, AUD-02, AUD-03, FIN-01, FIN-02, FIN-03, FIN-04, FIN-05

**Dependencies:**
- Fase 1 completada (análisis narrativo, DAFO, perfiles sugeridos) ✓
- Datos de mercado de audiencias por género/territorio (fuentes a investigar)
- Normativa de ayudas vigente (ICAA, MEDIA, Ibermedia, CC.AA.)

**Success Criteria:**
1. Buyer personas se generan automáticamente desde el análisis narrativo con datos accionables
2. Estrategia de comunicación conecta narrativa → audiencia → canales → mensajes
3. Mapa de financiación cubre las principales fuentes españolas y europeas
4. Simulador permite probar diferentes escenarios de financiación con cashflow
5. Sistema detecta incompatibilidades entre ayudas según normativa vigente

---

## Phase Order Rationale

1. **Producción primero** — Es la continuación natural de la Fase 1 (análisis). Los datos ya están disponibles, solo hay que transformarlos en herramientas de producción. Máximo valor con mínimo esfuerzo.
2. **Distribución segundo** — Con el dossier de producción listo, el productor necesita saber dónde enviar su proyecto. Los festivales son el siguiente paso natural.
3. **Audiencias + Financiación tercero** — Requiere más investigación de datos externos (mercado, normativa). Se beneficia de tener las dos fases anteriores completadas para ofrecer una visión integral.

---
*Last updated: 2025-02-25 after GSD initialization*
