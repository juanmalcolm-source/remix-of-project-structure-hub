// ── Constants ─────────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 180_000; // 180 seconds (SSE streaming keeps alive)

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

// ── AI generation with SSE streaming ──────────────────────────────────

interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function generateWithAI({ prompt, systemPrompt, maxTokens }: AIGenerateParams): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt, maxTokens }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Error responses come as JSON (not SSE)
      let errorMsg = `Error HTTP ${response.status}`;
      try {
        const errData = await response.json();
        errorMsg = errData.error || errorMsg;
      } catch { /* keep default */ }
      throw new Error(errorMsg);
    }

    // Read SSE stream and accumulate text
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta del servidor');

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = ''; // Buffer for incomplete SSE lines split across chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last (potentially incomplete) line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === 'delta' && parsed.text) {
              fullText += parsed.text;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Error en la generación');
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Error en la generación') {
              continue; // Ignore JSON parse errors on SSE lines
            }
            throw e;
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AITimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
