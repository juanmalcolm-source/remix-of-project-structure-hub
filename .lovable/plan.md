

## Fix: Robust AI Budget Generation

### Problem
The `generar-presupuesto` edge function fails intermittently because the AI model returns non-JSON content. The app itself loads fine -- the error only occurs when clicking "Generate with AI" on the budget page.

### Solution

**1. Edge Function (`supabase/functions/generar-presupuesto/index.ts`)**
- Add `response_format: { type: "json_object" }` to the AI request to force JSON output (supported by the Lovable AI gateway)
- Simplify the system prompt to reduce the chance of non-JSON output
- Add a retry mechanism: if parsing fails on the first attempt, retry the AI call once
- Add better error logging to capture the raw response for debugging

**2. Frontend Resilience (`src/pages/produccion/PresupuestoICAA.tsx`)**
- Show a more helpful error message when the AI generation fails, suggesting to retry
- No structural changes needed

### Technical Details

```text
Edge Function Changes:
1. Add response_format: { type: "json_object" } to force structured output
2. Add retry logic (1 retry on parse failure)  
3. Better error messages with truncated raw content for debugging
```

### Files to Modify
- `supabase/functions/generar-presupuesto/index.ts` -- Add JSON mode + retry logic

