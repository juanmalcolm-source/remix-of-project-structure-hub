

## Fix: Error "Failed to send a request to the Edge Function" en extract-pdf-text

### Problema diagnosticado

Los logs muestran que la funcion arranca correctamente pero **ninguna peticion llega al handler**. El error "Failed to fetch" en el cliente indica que la peticion CORS preflight (OPTIONS) falla porque los headers permitidos no incluyen los que envia el SDK de Supabase v2.80.

Ademas, la libreria `pdfjs-serverless` importada desde `esm.sh` puede fallar silenciosamente en el edge runtime de Deno.

### Plan de correccion

#### 1. Actualizar CORS headers en `supabase/functions/extract-pdf-text/index.ts`

Cambiar los headers CORS para incluir todos los que envia el SDK:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

#### 2. Reemplazar la libreria de PDF por una mas fiable

Cambiar `pdfjs-serverless` (que puede tener problemas con esm.sh) por `pdf-parse` via `npm:` specifier, que es mas estable en Deno:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Usar npm: specifier en lugar de esm.sh
import pdf from "npm:pdf-parse@1.1.1/lib/pdf-parse.js";
```

La logica de extraccion se simplifica porque `pdf-parse` devuelve directamente el texto completo sin necesidad de iterar pagina por pagina.

#### 3. Redesplegar la funcion

Tras los cambios, redesplegar `extract-pdf-text` para que los cambios tomen efecto.

### Archivos a modificar

- `supabase/functions/extract-pdf-text/index.ts` - Actualizar CORS + reemplazar libreria PDF

### Resultado esperado

Al subir un PDF, la peticion CORS preflight se completara correctamente, la funcion procesara el archivo y devolvera el texto extraido sin errores.
