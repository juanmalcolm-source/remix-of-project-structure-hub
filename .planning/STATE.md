# State — Fractal Kit

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-25)

**Core value:** El análisis narrativo profundo con IA es el motor central — todo se deriva del guión.
**Current focus:** Phase 1 — Polish & Export

## Codebase Audit Results (2025-02-25)

**27 de 29 páginas son funcionales.** Lovable construyó la gran mayoría de features.

| Módulo | Pages | Working | Placeholder |
|--------|-------|---------|-------------|
| Producción | 9 + 2 Edge Fn | 7 + 2 | 2 |
| Distribución/Convocatorias | 6 | 6 | 0 |
| Audiencias | 5 | 5 | 0 |
| Financiación | 7 | 7 | 0 |

**Placeholders:** ExportDossierPage.tsx, ExportExcelPage.tsx
**Parciales:** MemoriaProduccionPage.tsx (sin BD), DesglosePersonajesPage.tsx (sin mutations)

## Current Phase

**Phase 1: Polish & Export** — Not started

### Phase Status
- [ ] GAP-03: Persistencia BD en Memoria de Producción
- [ ] GAP-04: Mutations en Desglose de Personajes
- [ ] GAP-01: Export Dossier PDF/PPTX
- [ ] GAP-02: Export Excel real (.xlsx)
- [ ] GAP-08: Poblar BD festivales (50+ reales)
- [ ] GAP-05: Google Maps integration

### Blockers
None

### Active Decisions
None yet — pending `/gsd:discuss-phase 1`

## History

| Date | Event | Outcome |
|------|-------|---------|
| 2025-02-25 | GSD initialized | Docs creados con 3 fases, 20 requirements |
| 2025-02-25 | Codebase audit | Descubierto que 90%+ ya construido por Lovable |
| 2025-02-25 | GSD docs rewritten | Reducido a 2 fases, 8 gaps reales |
| 2025-02-25 | Fase 1 análisis narrativo confirmed | Todas las features de análisis validadas |
| 2025-02-25 | Edge Function optimized | Smart fallback Pro→Flash con AbortController |
| 2025-02-25 | CORS fix deployed | SDK v2.80 headers añadidos |

## Technical Debt

- Edge Function `extract-pdf-text` — CORS fix de Lovable, verificar estabilidad
- `generar-presupuesto` — Funcional pero sin caché ni historial de versiones
- `generar-memoria` — Funcional pero sin persistencia en BD (gap principal)
- DesglosePersonajes — Lee datos del análisis pero mutations son simuladas
- ExportDossier/ExportExcel — UI shells sin backend
- Google Maps — Campos manuales de GPS, sin autocomplete ni mapa

## Context for Next Session

- El proyecto usa Lovable como plataforma de desarrollo principal
- El usuario es productor audiovisual experto, no programador
- Edge Functions se despliegan vía git push → Lovable redeploy
- API key: `LOVABLE_API_KEY` en Supabase secrets
- GitHub token puede necesitar renovación
- **Clave**: La mayoría del trabajo ya está hecho. Solo quedan 8 gaps.
- **Siguiente paso**: `/gsd:discuss-phase 1` o empezar directamente con GAP-03 (persistencia)

---
*Last updated: 2025-02-25 after codebase audit*
