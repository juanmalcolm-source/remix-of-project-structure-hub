# Requirements — Fractal Kit v1

> **Post-auditoría**: La mayoría de features originales ya están construidas por Lovable.
> Este documento refleja solo los **gaps reales** que quedan por completar.

## v1 Requirements (Gaps activos)

### Exports Profesionales (EXPORT)

- [ ] **GAP-01**: Usuario puede exportar dossier de producción completo a PDF o PPTX con formato profesional, agregando datos de todas las secciones (creativa, producción, financiación)
- [ ] **GAP-02**: Usuario puede exportar datos a Excel real (.xlsx) con fórmulas, no solo CSV — presupuesto ICAA, desglose personajes, desglose localizaciones

### Persistencia y Data Integrity (DATA)

- [ ] **GAP-03**: Memoria de producción persiste en base de datos — actualmente genera con IA streaming pero el contenido se pierde al navegar
- [ ] **GAP-04**: Desglose de personajes persiste cambios de casting/presupuesto — actualmente read-only con saves simulados

### Integración Google Maps (MAPS)

- [ ] **GAP-05**: Lugares físicos tienen autocomplete de dirección, geocoding automático y mapa interactivo — actualmente solo campos manuales de GPS

### Intelligence Layer (INTEL)

- [ ] **GAP-06**: Sistema de learning que compara datos reales de rodaje vs estimaciones de IA para calibrar futuras predicciones (días reales, costes reales, tiempos reales)
- [ ] **GAP-07**: Matching IA entre análisis DAFO/narrativo del guión y festivales de la BD — la BD de festivales existe pero no hay recomendación automática

### Contenido / Datos (CONTENT)

- [ ] **GAP-08**: Base de datos de festivales españoles poblada con al menos 50 festivales (ICAA + clase A) con datos reales (fechas, requisitos, categorías, contacto)

## Traceability

| Requirement | Phase | Priority | Effort |
|-------------|-------|----------|--------|
| GAP-01 | Phase 1: Polish & Export | Alta | Media |
| GAP-02 | Phase 1: Polish & Export | Alta | Media |
| GAP-03 | Phase 1: Polish & Export | Alta | Baja |
| GAP-04 | Phase 1: Polish & Export | Media | Baja |
| GAP-05 | Phase 1: Polish & Export | Media | Media |
| GAP-06 | Phase 2: Intelligence | Baja | Alta |
| GAP-07 | Phase 2: Intelligence | Media | Media |
| GAP-08 | Phase 1: Polish & Export | Alta | Media (data entry) |

## Already Validated (construido por Lovable)

### Producción ✓
- Presupuesto ICAA con IA y CRUD (12 capítulos, versiones, bulk ops)
- Plan de rodaje con drag-and-drop y Ley de Octavos
- Memoria de producción con generación IA streaming (7 secciones)
- Desglose de secuencias con CRUD y scoring de complejidad
- Desglose de localizaciones con CRUD y matriz de distancias
- Lugares físicos con gestión, zonas y estado de completitud

### Distribución + Convocatorias ✓
- Gestión de festivales con CRUD completo
- Plan de distribución por canal/territorio con ingresos
- Biblioteca de convocatorias con búsqueda avanzada y resúmenes IA
- Calendario interactivo de deadlines
- Gestión de tareas por solicitud con KPIs
- Workspace con análisis de elegibilidad IA

### Audiencias ✓
- Análisis de mercado con IA
- Segmentos de audiencia con CRUD
- Buyer personas con CRUD + generación IA
- Estrategia de comunicación por fases

### Financiación ✓
- Dashboard financiero con gráficos
- CRUD de fuentes de financiación
- Simulador de incentivos What-If
- Calculadora de intensidad de ayuda
- Comparador de territorios fiscales
- Timeline de cashflow con detección de gaps
- Configuración de parámetros financieros

## v2 Requirements (Deferred)

- Integración con Movie Magic / EP Budgeting (formatos de exportación)
- Conectar con APIs de festivales en tiempo real (FilmFreeway, Festhome)
- Multi-idioma (inglés y francés)
- Colaboración en tiempo real entre miembros del equipo
- App móvil nativa
- Integración con herramientas de casting
- Dashboard de analytics de rendimiento de distribución

## Out of Scope

- Edición de video o postproducción
- CRM de contactos de la industria
- Contabilidad y facturación
- Streaming o exhibición de contenido
- Marketplace de servicios (casting, crew)

---
*Last updated: 2025-02-25 after codebase audit — reduced from 20 requirements to 8 gaps*
