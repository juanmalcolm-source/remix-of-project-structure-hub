export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let payload: { prompt: string; systemPrompt?: string; maxTokens?: number };
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'JSON inválido en la solicitud' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { prompt, systemPrompt, maxTokens } = payload;

  if (!prompt || prompt.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: 'No se proporcionó prompt' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body: Record<string, unknown> = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens || 4096,
    temperature: 0.3,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text().catch(() => '');
    let errorMsg = `Error HTTP ${anthropicResponse.status}`;
    try { errorMsg = JSON.parse(errorText).error?.message || errorMsg; } catch { /* keep default */ }

    if (anthropicResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Límite de solicitudes excedido. Espera unos momentos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Error de la API: ${errorMsg}` }),
      { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Stream SSE deltas TO the client to keep Vercel connection alive
  const reader = anthropicResponse.body!.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]' || data === '') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: parsed.delta.text })}\n\n`)
                  );
                } else if (parsed.type === 'message_stop') {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
                  );
                } else if (parsed.type === 'error') {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', error: parsed.error?.message || 'Error' })}\n\n`)
                  );
                }
              } catch {
                // Ignore unparseable SSE lines
              }
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'Error en el stream' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
