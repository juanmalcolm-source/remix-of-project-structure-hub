
# Plan: Modulo de Produccion Completo (v2)

Este plan cubre las 4 secciones del Modulo de Produccion segun el PRD v3.0. Dado el tamano, se divide en **4 fases secuenciales** que se pueden implementar una tras otra.

---

## Estado Actual vs PRD

| Seccion | Estado Actual | Trabajo Necesario |
|---------|--------------|-------------------|
| Desglose de Guion | Pagina basica sin CRUD real, sin factores complejidad | Reescritura completa |
| Localizaciones | Solo estado local, sin DB, sin distancias | Reescritura completa |
| Plan de Rodaje | Funcional con tabla `shooting_days` plana | Actualizar calculos de tiempo segun PRD |
| Presupuesto ICAA | Bastante completo con IA | Anadir versionado |

---

## Fase 1: Desglose de Guion (DesglosePage)

### Migracion de Base de Datos

Anadir columnas faltantes a la tabla `sequences`:

```sql
ALTER TABLE sequences
  ADD COLUMN IF NOT EXISTS int_ext TEXT DEFAULT 'INT',
  ADD COLUMN IF NOT EXISTS dia_ficcion INT,
  ADD COLUMN IF NOT EXISTS complejidad_factores JSONB DEFAULT '{}';
```

### Archivos a Crear/Modificar

1. **`src/hooks/useSequences.ts`** (nuevo)
   - `useSequences(projectId)` - query con order por sequence_number
   - `useCreateSequence()` - mutation insert
   - `useUpdateSequence()` - mutation update
   - `useDeleteSequence()` - mutation delete
   - Invalidacion de cache automatica

2. **`src/pages/produccion/DesglosePage.tsx`** (nuevo, reemplaza ruta actual)
   - Tabla con columnas: numero, encabezado (title), INT/EXT, momento_dia, octavos, score complejidad, localizacion, personajes
   - Badge de colores para complejidad (baja/media/alta/extrema)
   - Boton "Anadir Secuencia" abre Dialog
   - Click en fila abre Dialog de edicion
   - Boton eliminar con AlertDialog de confirmacion (NO `confirm()`)
   - Stats superiores: total secuencias, total octavos, media complejidad

3. **`src/components/features/SequenceDialog.tsx`** (nuevo)
   - Dialog con formulario completo:
     - Numero, encabezado/titulo, descripcion
     - Select INT/EXT, Select momento_dia (DIA/NOCHE/ATARDECER/AMANECER)
     - Input octavos (numerico)
     - Select localizacion (de locations del proyecto)
     - Multi-select personajes (de characters del proyecto)
   - Seccion "Factores de Complejidad":
     - 13 checkboxes: movimiento_camara, accion_fisica, stunts, efectos_especiales, ninos, animales, vehiculos_movimiento, iluminacion_compleja, escena_noche, exteriores_clima, dialogo_extenso, requiere_grua, planos_especiales
     - 2 inputs numericos: num_personajes, num_extras
   - Score calculado automaticamente en tiempo real

4. **`src/utils/complejidad.ts`** (nuevo)
   - Funcion `calcularScoreComplejidad(factores: ComplejidadFactores): number`
   - Pesos definidos como constantes
   - Retorna score 0-100 y categoria (baja/media/alta/extrema)

### Cambio en App.tsx

- Anadir ruta `/produccion/:projectId/desglose` apuntando a DesglosePage
- Actualizar ProductionLayout para incluir tab "Desglose"

---

## Fase 2: Localizaciones

### Archivos a Crear/Modificar

1. **`src/hooks/useLocations.ts`** (nuevo)
   - `useLocations(projectId)` - query
   - `useCreateLocation()` - mutation
   - `useUpdateLocation()` - mutation
   - `useDeleteLocation()` - mutation
   - `useLocationDistances(projectId)` - query distancias
   - `useSaveDistances()` - mutation bulk insert distancias

2. **`src/pages/produccion/LocalizacionesPage.tsx`** (reescribir DesgloseLocalizacionesPage)
   - CRUD completo con Dialog
   - Campos: nombre, direccion, coordenadas GPS (lat/lng), notas
   - AlertDialog para confirmar eliminacion
   - Stats: total localizaciones, interiores, exteriores
   - Tabla de distancias Haversine entre pares de localizaciones

3. **`src/components/features/LocationDialog.tsx`** (nuevo)
   - Dialog con formulario: nombre, direccion, lat, lng, notas

4. **`src/utils/haversine.ts`** (nuevo)
   - Funcion `calcularDistanciaHaversine(lat1, lon1, lat2, lon2): number` (km)
   - Funcion `calcularMatrizDistancias(locations): DistanceEntry[]`
   - Guardar resultados en `location_distances`

---

## Fase 3: Plan de Rodaje v2 - Actualizacion de Calculos

El sistema actual ya funciona bien con la tabla `shooting_days`. En lugar de migrar a las 3 tablas nuevas del PRD (lo cual romperia toda la funcionalidad existente), se actualiza el motor de calculo.

### Archivos a Modificar

1. **`src/services/shootingPlanService.ts`** - Actualizar calculos de tiempo:
   - Setup: 30min (INT) o 45min (EXT), +15min si NOCHE (actualmente 45/60/+15)
   - Rodaje base: octavos x 8 x 13min (actualmente octavos x 11.25min)
   - Cobertura: +50% si accion/stunts, +30% si dialogo_extenso (nuevo)
   - Transicion: 5min base (nuevo)
   - Aplicar los 15 pesos de complejidad del PRD:
     - num_personajes > 2: +5min/personaje
     - movimiento_camara: +15min
     - accion_fisica: +20min
     - stunts: +40min
     - efectos_especiales: +30min
     - ninos: +15min
     - animales: +25min
     - vehiculos_movimiento: +30min
     - extras (cada 5): +5min
     - iluminacion_compleja: +20min
     - escena_noche: +10min
     - exteriores_clima: +8min
     - dialogo_extenso: +10min
     - requiere_grua: +20min
     - planos_especiales: +15min

2. **`src/services/shootingPlanService.ts`** - Anadir restricciones:
   - Warning si jornada >10h, Error si >12h
   - Max 5 noches consecutivas (warning desde 3)
   - 1 dia descanso cada 6
   - Max 7 dias espera actor
   - Ninos: max 8h, no noche

3. **`src/pages/produccion/PlanRodajePage.tsx`**:
   - Reemplazar `confirm()` en handleDeleteDay y handleClearPlan con AlertDialog
   - Anadir estrategia "actores" al generador (min dias espera entre actores)

4. **`src/components/features/ShootingPlanGenerator.tsx`**:
   - Asegurar que las 4 estrategias estan disponibles: logistica, actores, complejidad, equilibrada

---

## Fase 4: Presupuesto ICAA - Versionado

### Archivos a Modificar

1. **`src/hooks/useBudgetVersions.ts`** (nuevo)
   - `useBudgetVersions(projectId)` - query versiones
   - `useCreateBudgetVersion()` - guardar snapshot actual
   - `useLoadBudgetVersion()` - cargar version especifica

2. **`src/pages/produccion/PresupuestoICAA.tsx`**:
   - Boton "Guardar Version" que crea snapshot en `budget_versions`
   - Panel lateral o Tab con lista de versiones guardadas
   - Boton "Cargar" para restaurar una version anterior
   - Comparar totales entre versiones
   - Reemplazar cualquier `confirm()` restante con AlertDialog

---

## Seccion Tecnica

### Patron de implementacion (todas las fases)

```text
Pages (UI) -> Hooks (useQuery/useMutation) -> Services -> Supabase Client
```

- Skeleton para estados de carga
- Alert para estados vacios
- Badge con colores segun estado/complejidad
- Formato moneda: `toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })`
- Toda la UI en espanol
- AlertDialog de shadcn para confirmaciones (nunca `confirm()`)
- `import type` para imports solo de tipo

### Archivos nuevos totales: ~10
### Archivos modificados: ~5
### Migraciones DB: 1 (anadir columnas a sequences)

### Orden de implementacion recomendado

1. Fase 1 (Desglose) - base para todo lo demas
2. Fase 2 (Localizaciones) - independiente
3. Fase 3 (Plan Rodaje) - depende de Fase 1 para factores complejidad
4. Fase 4 (Presupuesto) - independiente
