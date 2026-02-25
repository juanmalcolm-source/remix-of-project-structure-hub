# Fractal Kit

## What This Is

Fractal Kit es una plataforma SaaS de gestión integral de producción cinematográfica potenciada por IA. Permite a productores audiovisuales analizar guiones, planificar rodajes, gestionar presupuestos, mapear audiencias, rastrear convocatorias/festivales y optimizar la distribución — todo conectado desde el análisis narrativo inicial. Dirigido a productores independientes y pequeñas productoras en el mercado hispanohablante.

## Core Value

El análisis narrativo profundo con IA es el motor central: todo lo demás (presupuesto, plan de rodaje, audiencias, distribución, financiación) se deriva y conecta con el análisis del guión. Si el análisis funciona bien, el resto del sistema tiene datos inteligentes para trabajar.

## Requirements

### Validated

#### Análisis Narrativo (Fase 1 — Completada)
- ✓ Subida de archivos PDF/TXT con extracción de texto — Fase 1
- ✓ Análisis narrativo profundo con IA (estructura actos, curva emocional, puntos de giro, conflictos, ritmo, temática) — Fase 1
- ✓ Análisis DAFO del guión (scores narrativo/comercial/festival) — Fase 1
- ✓ Desglose de personajes con análisis profundo (arco, ghost, stakes, función narrativa) — Fase 1
- ✓ Mapa de relaciones entre personajes — Fase 1
- ✓ Desglose de localizaciones (INT/EXT, complejidad, necesidades técnicas) — Fase 1
- ✓ Desglose de secuencias con análisis de complejidad (15 factores) — Fase 1
- ✓ Estimación de días de rodaje (mínima/máxima/recomendada) — Fase 1
- ✓ Smart model fallback (Gemini Pro → Flash → GPT-5 Mini con timeouts) — Fase 1
- ✓ Autenticación con Supabase Auth — Fase 1
- ✓ Perfiles de audiencia sugeridos desde análisis narrativo — Fase 1
- ✓ Potencial de mercado sugerido desde análisis narrativo — Fase 1

#### Producción (Auditoría 2025-02-25 — Lovable ya lo construyó)
- ✓ Presupuesto ICAA con IA y CRUD completo (12 capítulos, versiones, bulk ops) — Lovable
- ✓ Plan de rodaje con drag-and-drop y Ley de Octavos — Lovable
- ✓ Memoria de producción con generación IA streaming (7 secciones) — Lovable (parcial: sin persistencia BD)
- ✓ Desglose de secuencias con CRUD y scoring de complejidad — Lovable
- ✓ Desglose de localizaciones con CRUD y matriz de distancias Haversine — Lovable
- ✓ Lugares físicos con gestión, zonas y estado de completitud — Lovable
- ✓ Edge Function `generar-presupuesto` operativa (Gemini Flash, formato ICAA) — Lovable
- ✓ Edge Function `generar-memoria` operativa (streaming SSE, 7 secciones) — Lovable

#### Distribución + Convocatorias (Auditoría 2025-02-25 — Lovable ya lo construyó)
- ✓ Gestión de festivales con CRUD completo — Lovable
- ✓ Plan de distribución por canal/territorio con ingresos estimados — Lovable
- ✓ Biblioteca de convocatorias con búsqueda avanzada y resúmenes IA — Lovable
- ✓ Calendario interactivo de deadlines con codificación por ámbito — Lovable
- ✓ Gestión de tareas por solicitud con KPIs y detección de vencidas — Lovable
- ✓ Workspace con análisis de elegibilidad IA y generación de documentos — Lovable

#### Audiencias (Auditoría 2025-02-25 — Lovable ya lo construyó)
- ✓ Análisis de mercado con IA (tamaño, segmentos, tendencias, riesgos) — Lovable
- ✓ Segmentos de audiencia con CRUD — Lovable
- ✓ Buyer personas con CRUD + generación IA (3 personas auto) — Lovable
- ✓ Estrategia de comunicación por fases con presupuesto y tracking — Lovable

#### Financiación (Auditoría 2025-02-25 — Lovable ya lo construyó)
- ✓ Dashboard financiero con gráficos y KPIs consolidados — Lovable
- ✓ CRUD de fuentes de financiación con estados y fechas de pago — Lovable
- ✓ Simulador de incentivos What-If (2 escenarios, 5 territorios) — Lovable
- ✓ Calculadora de intensidad de ayuda con límites legales — Lovable
- ✓ Comparador de territorios fiscales con fórmulas reales — Lovable
- ✓ Timeline de cashflow con detección de gaps de liquidez — Lovable
- ✓ Configuración de parámetros financieros del proyecto — Lovable

### Active

- [ ] GAP-01: Export Dossier profesional a PDF/PPTX — página existe pero sin generación real
- [ ] GAP-02: Export a Excel real — actualmente solo CSV mock
- [ ] GAP-03: Persistencia BD en Memoria de Producción — genera con IA pero no guarda
- [ ] GAP-04: Mutations en Desglose de Personajes — lee datos pero no persiste cambios
- [ ] GAP-05: Google Maps integration en localizaciones — autocomplete, mapa interactivo, geocoding
- [ ] GAP-06: Learning system — que el sistema aprenda de datos reales vs estimados
- [ ] GAP-07: Matching IA guión-festivales — la BD de festivales existe pero no hay recomendación automática
- [ ] GAP-08: Poblar BD de festivales con datos reales ICAA/clase A (al menos 50 festivales)

### Out of Scope

- Edición de video o postproducción — Fractal Kit es pre-producción y distribución
- CRM de contactos de la industria — demasiado amplio, existen herramientas específicas
- Contabilidad y facturación — dominio fiscal complejo, mejor integrar con herramientas existentes
- Streaming o exhibición de contenido — fuera del ámbito de gestión de producción
- Marketplace de servicios (casting, crew) — requeriría modelo de negocio diferente

## Context

- **Stack actual**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL, Edge Functions en Deno, Auth, Storage)
- **IA**: Lovable Gateway (`ai.gateway.lovable.dev`) con modelos Gemini 2.5 Pro/Flash y GPT-5 Mini + Claude vía `aiService`
- **Desarrollo**: Lovable como plataforma principal (CI/CD, deploys), Claude Code para desarrollo avanzado
- **Supabase Project**: `yvyrqkckhpxvlcvinsht` — gestionado a través de Lovable (sin acceso directo al dashboard)
- **Edge Functions**: `analizar-guion`, `extract-pdf-text`, `ai-generate`, `generar-memoria`, `generar-presupuesto`
- **Hooks pattern**: Todos los módulos usan custom React hooks + React Query para Supabase
- **Auditoría 2025-02-25**: 27 de 29 páginas son funcionales. Solo 2 placeholders (ExportDossier, ExportExcel)
- **Usuario objetivo**: Productor audiovisual experto en cine, no programador

## Constraints

- **Plataforma**: Lovable gestiona Supabase — cambios en Edge Functions requieren push a git para que Lovable redeploy
- **API Key**: Una sola `LOVABLE_API_KEY` para todos los modelos IA a través del gateway
- **Edge Function timeout**: ~5 minutos máximo en Supabase — guiones largos necesitan fallback a modelos rápidos
- **Sin dashboard Supabase**: Todo cambio en DB/Functions se hace vía código y Lovable
- **Presupuesto IA**: Tokens cuestan dinero — usar modelos más baratos (Flash, Haiku) donde la calidad no sea crítica
- **Idioma**: Toda la UI y contenido generado debe estar en español

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini Pro primero, Flash como fallback | Pro da mejor calidad de análisis; Flash como safety net si Pro timeout | ✓ Good |
| Análisis narrativo como motor central | Todo el valor del producto se deriva del análisis del guión | ✓ Good |
| AbortController para timeouts en Edge Functions | Permite cortar Pro a 150s y fallback a Flash sin perder la request | ✓ Good |
| CORS headers extendidos para SDK v2.80 | Supabase SDK nuevo envía headers adicionales que necesitan allowlist | ✓ Good |
| Lovable como plataforma de desarrollo principal | Permite al usuario (no-coder) hacer cambios y desplegar | ✓ Good — construyó 27/29 páginas funcionales |
| GSD para workflow de desarrollo con Claude Code | Estructura los gaps restantes con planning y execution | — Pending |
| Auditar antes de planificar | Descubrimos que 90%+ del trabajo ya estaba hecho por Lovable | ✓ Good — evitó reconstruir |

---
*Last updated: 2025-02-25 after codebase audit*
