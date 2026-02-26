import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, projectData, currentContent } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un consultor senior de producción cinematográfica española con 15 años redactando memorias ganadoras para ICAA, Eurimages, MEDIA, Ibermedia, Creative Europe y televisiones públicas (TVE, TV3, ETB, Canal Sur).

INSTRUCCIONES GENERALES:
- Tono: profesional, apasionado, concreto y convincente para comités de evaluación
- Idioma: español de España (castellano formal)
- Extensión: 250-400 palabras por sección
- OBLIGATORIO: usa los DATOS ESPECÍFICOS del proyecto que recibes (scores, festivales, territorios, personajes, localizaciones). NO inventes datos genéricos.
- Si recibes scores del análisis (score_narrativo, score_comercial, score_festival), refléjalos indirectamente: un score alto = enfatizar esa fortaleza, un score bajo = no mencionarlo
- Si recibes festivales_sugeridos, mencionarlos por nombre en las secciones relevantes
- Si recibes territorios_principales, usarlos para argumentar potencial de mercado
- Si hay contenido existente, mejóralo y expándelo manteniendo la esencia, no lo reemplaces completamente`;

    const sectionPrompts: Record<string, string> = {
      director_intentions: `Redacta las INTENCIONES DEL DIRECTOR (250-400 palabras).
OBLIGATORIO usar del proyecto: tema_central, nucleo_emocional, tono, estilo_visual.
Incluye: visión artística fundamentada en el tema central, por qué esta historia AHORA (relevancia social/cultural), qué experiencia quiere provocar en el espectador, referentes cinematográficos concretos que inspiran el enfoque.
NO uses frases genéricas como "una historia universal" — sé específico con los datos del proyecto.`,

      artistic_vision: `Redacta la VISIÓN ARTÍSTICA del proyecto (250-400 palabras).
OBLIGATORIO usar: tono, estilo_visual, localizaciones (mencionar por nombre), genero.
Incluye: propuesta de fotografía (luz natural vs artificial, formato, aspecto), paleta cromática justificada por la narrativa, atmósfera sonora, ritmo de montaje. Conecta cada decisión estética con el tema_central del guión.`,

      personal_connection: `Redacta la CONEXIÓN PERSONAL del equipo con esta historia (200-300 palabras).
OBLIGATORIO usar: tema_central, nucleo_emocional.
Incluye: motivación personal del director/a, experiencias vitales que conectan con la historia, por qué ESTE equipo es el idóneo para contar ESTA historia. Tono emotivo pero contenido — los comités valoran autenticidad, no melodrama.`,

      target_audience: `Define el PÚBLICO OBJETIVO del proyecto (250-400 palabras).
OBLIGATORIO usar: territorios_principales, plataformas_potenciales, festivales_sugeridos, genero.
Incluye: segmento primario (edad, perfil, motivación), segmento secundario, comparables de taquilla/streaming en España, potencial internacional por territorios (mencionar los territorios del análisis), circuito de festivales objetivo (mencionar los festivales sugeridos por nombre).`,

      aesthetic_proposal: `Desarrolla la PROPUESTA ESTÉTICA completa (300-500 palabras).
OBLIGATORIO usar: estilo_visual, tono, localizaciones (con nombre y tipo), personajes principales.
Incluye: dirección de fotografía (ópticas, movimiento, iluminación), dirección de arte (paleta, espacios, época), vestuario (concepto por personaje principal), maquillaje/peluquería si relevante, VFX si aplica. Cada decisión debe estar justificada narrativamente.`,

      production_viability: `Argumenta la VIABILIDAD DE PRODUCCIÓN (300-500 palabras).
OBLIGATORIO usar: estimated_budget_range, localizaciones, personajes (número por categoría), festivales_sugeridos, territorios_principales.
Incluye: plan de rodaje realista (semanas prep/rodaje/post), presupuesto estimado y cómo se cubre (ayudas ICAA, TV, ventas internacionales), ventanas de explotación (festivales → salas → plataformas), posibilidades de coproducción con los territorios identificados, calendario realista.`,

      team_strengths: `Destaca las FORTALEZAS DEL EQUIPO (200-300 palabras).
Incluye: trayectoria del director/a, premios y selecciones, proyectos anteriores relevantes, experiencia del productor/a, complementariedad del equipo. Menciona por qué este equipo es especialmente competente para los retos específicos de ESTE proyecto (según localizaciones, género, complejidad).`,
    };

    const userPrompt = `DATOS DEL PROYECTO:
${JSON.stringify(projectData, null, 2)}

${currentContent ? `CONTENIDO ACTUAL A MEJORAR:\n${currentContent}\n\n` : ''}

${sectionPrompts[section] || 'Genera contenido profesional para esta sección de la memoria de producción.'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo de nuevo en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Añade fondos en la configuración." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error en generar-memoria:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
