import { supabase } from "@/integrations/supabase/client";

interface AIGenerateParams {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
}

export async function generateWithAI({ prompt, systemPrompt, maxTokens }: AIGenerateParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-generate", {
    body: { prompt, systemPrompt, maxTokens },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.text;
}

/** Extract a JSON object or array from a text response that may contain markdown fences */
export function extractJson<T = unknown>(text: string): T {
  // Try to find JSON inside ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}
