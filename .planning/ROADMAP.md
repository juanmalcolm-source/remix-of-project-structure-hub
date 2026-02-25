# Roadmap — Fractal Kit

> **Post-auditoría**: El roadmap original tenía 3 fases grandes con 20 requirements.
> Tras descubrir que Lovable ya construyó el 90%+ de la funcionalidad, quedan 2 fases
> enfocadas en **completar gaps** y añadir **inteligencia**.

## Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Polish & Export | Completar gaps de persistencia, exports profesionales y datos | GAP-01 → GAP-05, GAP-08 | 5 |
| 2 | Intelligence | Sistema de learning + matching IA guión-festivales | GAP-06, GAP-07 | 3 |

**2 phases** | **8 requirements** | All gaps covered ✓

---

## Phase 1: Polish & Export

**Goal:** Cerrar todos los gaps funcionales para que la plataforma sea completamente operativa de extremo a extremo — que un productor pueda hacer todo el ciclo sin encontrarse con funcionalidades rotas o incompletas.

**Requirements:** GAP-01, GAP-02, GAP-03, GAP-04, GAP-05, GAP-08

**Dependencies:** Ninguna — todo el código base ya existe, solo hay que completar.

**Success Criteria:**
1. Dossier de producción se exporta a PDF profesional agregando datos de todas las secciones
2. Datos se exportan a Excel real (.xlsx) con formato ICAA y fórmulas
3. Memoria de producción se guarda en BD y sobrevive navegación
4. Cambios en desglose de personajes (casting, tarifas) se persisten en BD
5. Al menos 50 festivales españoles reales cargados en la BD con datos completos

**Effort estimado:** Medio — la mayoría son fixes de persistencia y librerías de export.

**Prioridad interna de tareas:**
1. GAP-03 + GAP-04 (persistencia) — impacto alto, esfuerzo bajo
2. GAP-01 + GAP-02 (exports) — impacto alto, esfuerzo medio
3. GAP-08 (datos festivales) — impacto alto, esfuerzo medio (data entry)
4. GAP-05 (Google Maps) — impacto medio, esfuerzo medio

---

## Phase 2: Intelligence

**Goal:** Añadir la capa de inteligencia que diferencia Fractal Kit de una simple herramienta de gestión — que el sistema aprenda de datos reales y recomiende festivales basándose en el análisis narrativo.

**Requirements:** GAP-06, GAP-07

**Dependencies:**
- Phase 1 completada (datos de festivales necesarios para matching)
- Datos reales de al menos 1 producción para calibrar learning

**Success Criteria:**
1. Sistema registra datos reales de rodaje vs estimaciones de IA
2. Futuras estimaciones se calibran con datos históricos reales
3. Al subir un guión, el sistema recomienda festivales relevantes basándose en género, temática, DAFO, territorio y fechas

**Effort estimado:** Alto — requiere diseño de data model para learning y lógica de matching.

---

## Phase Order Rationale

1. **Polish & Export primero** — Cerrar gaps es prerequisito para que la plataforma sea usable en producción real. Sin persistencia y exports, el usuario pierde trabajo.
2. **Intelligence después** — El learning necesita datos reales que solo llegarán cuando productores usen la plataforma. El matching necesita la BD de festivales que se llena en Phase 1.

---
*Last updated: 2025-02-25 after codebase audit — reduced from 3 phases/20 reqs to 2 phases/8 gaps*
