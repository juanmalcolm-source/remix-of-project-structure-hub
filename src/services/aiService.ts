import { supabase } from "@/integrations/supabase/client";

// ── Constants ─────────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 60_000; // 60 seconds

// ── Error classes ─────────────────────────────────────────────────────
export class AIParseError extends Error {
  constructor(public rawText: string) {
    super('La IA no generó un formato válido. Inténtalo de nuevo — cada generación es diferente.');
    this.name = 'AIParseError';
  }
}

export class AITimeoutError extends Error {
  constructor() {
    super('La generación tardó demasiado. Inténtalo de nuevo.');
    this.name = 'AITimeoutError';
  }
}

// ── AI generation with timeout ────────────────────────────────────────

interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function generateWithAI({ prompt, systemPrompt, maxTokens }: AIGenerateParams): Promise<string> {
  const aiPromise = supabase.functions.invoke("ai-generate", {
    body: { prompt, systemPrompt, maxTokens },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AITimeoutError()), AI_TIMEOUT_MS),
  );

  const { data, error } = await Promise.race([aiPromise, timeoutPromise]);

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.text;
}

// ── Resilient JSON extraction ─────────────────────────────────────────

/** Extract a JSON object or array from a text response that may contain markdown fences.
 *  Two-pass strategy: first tries standard fence extraction, then falls back to
 *  finding the outermost bracket pair in the raw text. */
export function extractJson<T = unknown>(text: string): T {
  // Pass 1: Try to find JSON inside ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Pass 2: Find the first [ or { and match to its last closing counterpart
    const startIdx = jsonStr.search(/[\[{]/);
    if (startIdx >= 0) {
      const bracket = jsonStr[startIdx];
      const endBracket = bracket === '[' ? ']' : '}';
      const lastIdx = jsonStr.lastIndexOf(endBracket);
      if (lastIdx > startIdx) {
        try {
          return JSON.parse(jsonStr.slice(startIdx, lastIdx + 1));
        } catch {
          // fall through to error
        }
      }
    }
    throw new AIParseError(text);
  }
}
