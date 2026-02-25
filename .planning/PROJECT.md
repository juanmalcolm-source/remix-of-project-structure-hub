# Fractal Kit

## What This Is

Fractal Kit es una plataforma SaaS de gestión integral de producción cinematográfica potenciada por IA. Permite a productores audiovisuales analizar guiones, planificar rodajes, gestionar presupuestos, mapear audiencias, rastrear convocatorias/festivales y optimizar la distribución — todo conectado desde el análisis narrativo inicial. Dirigido a productores independientes y pequeñas productoras en el mercado hispanohablante.

## Core Value

El análisis narrativo profundo con IA es el motor central: todo lo demás (presupuesto, plan de rodaje, audiencias, distribución, financiación) se deriva y conecta con el análisis del guión. Si el análisis funciona bien, el resto del sistema tiene datos inteligentes para trabajar.

## Requirements

### Validated

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

### Active

#### Fase 2 — Producción Inteligente
- [ ] PROD-01: Presupuesto ICAA generado automáticamente desde desglose del análisis
- [ ] PROD-02: Plan de rodaje optimizado por IA (agrupación por localizaciones, disponibilidad, complejidad)
- [ ] PROD-03: Memoria de producción generada por IA
- [ ] PROD-04: Export a Excel/PDF profesional (dossier de producción)
- [ ] PROD-05: Desglose de localizaciones con lugares físicos reales (Google Maps integration)
- [ ] PROD-06: Learning — El sistema aprende de datos reales de rodaje para mejorar estimaciones

#### Fase 3 — Distribución + Festivales
- [ ] DIST-01: Base de datos de festivales españoles (ICAA, clase A) con filtros inteligentes
- [ ] DIST-02: Calendario de convocatorias y deadlines con alertas
- [ ] DIST-03: Matching IA entre análisis del guión y festivales recomendados
- [ ] DIST-04: Tracking de submissions a festivales
- [ ] DIST-05: Laboratorios de desarrollo y residencias artísticas
- [ ] DIST-06: Workspace de gestión de tareas para convocatorias

#### Fase 4 — Audiencias + Financiación
- [ ] AUD-01: Perfiles de audiencia conectados al análisis narrativo (buyer personas detallados)
- [ ] AUD-02: Estrategia de comunicación generada por IA desde audiencia + narrativa
- [ ] AUD-03: Análisis de audiencias con datos de mercado
- [ ] FIN-01: Mapa de fuentes de financiación (ayudas públicas, privadas, coproducción)
- [ ] FIN-02: Simulador de plan financiero
- [ ] FIN-03: Cálculo de intensidad de ayuda e incompatibilidades
- [ ] FIN-04: Timeline de financiación con hitos y deadlines
- [ ] FIN-05: Configuración por territorios (España, Europa, Iberoamérica)

### Out of Scope

- Edición de video o postproducción — Fractal Kit es pre-producción y distribución
- CRM de contactos de la industria — demasiado amplio, existen herramientas específicas
- Contabilidad y facturación — dominio fiscal complejo, mejor integrar con herramientas existentes
- Streaming o exhibición de contenido — fuera del ámbito de gestión de producción
- Marketplace de servicios (casting, crew) — requeriría modelo de negocio diferente

## Context

- **Stack actual**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend**: Supabase (PostgreSQL, Edge Functions en Deno, Auth, Storage)
- **IA**: Lovable Gateway (`ai.gateway.lovable.dev`) con modelos Gemini 2.5 Pro/Flash y GPT-5 Mini
- **Desarrollo**: Lovable como plataforma principal (CI/CD, deploys), Claude Code para desarrollo avanzado
- **Supabase Project**: `yvyrqkckhpxvlcvinsht` — gestionado a través de Lovable (sin acceso directo al dashboard)
- **Edge Functions existentes**: `analizar-guion`, `extract-pdf-text`, `ai-generate`, `generar-memoria`, `generar-presupuesto`
- **Páginas ya creadas** (estructura UI existe, funcionalidad varía):
  - Producción: Desglose, Plan Rodaje, Presupuesto ICAA, Memoria, Export Dossier/Excel, Lugares Físicos
  - Audiencias: Análisis, Buyer Personas, Comunicación, Distribución, Festivales
  - Convocatorias: Biblioteca, Calendario, Tareas, Workspace
  - Financiación: Configuración, Fuentes, Intensidad, Resumen, Simulador, Territorios, Timeline
  - Creativa/Proyecto: Análisis Narrativo, Localizaciones, MoodBoard, Personajes, Viabilidad
- **Usuario objetivo**: Productor audiovisual experto en cine, no programador. La interfaz debe ser profesional, clara y en español.

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
| Análisis narrativo como motor central | Todo el valor del producto se deriva del análisis del guión | — Pending |
| AbortController para timeouts en Edge Functions | Permite cortar Pro a 150s y fallback a Flash sin perder la request | ✓ Good |
| CORS headers extendidos para SDK v2.80 | Supabase SDK nuevo envía headers adicionales que necesitan allowlist | ✓ Good |
| Lovable como plataforma de desarrollo principal | Permite al usuario (no-coder) hacer cambios y desplegar | — Pending |
| GSD para workflow de desarrollo con Claude Code | Estructura el desarrollo de Fases 2-4 con planning, research, execution | — Pending |

---
*Last updated: 2025-02-25 after GSD initialization*
