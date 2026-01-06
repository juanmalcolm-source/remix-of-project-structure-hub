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

    const systemPrompt = `Eres un consultor experto en producción cinematográfica española. 
Tu objetivo es ayudar a redactar memorias de producción profesionales para presentar a convocatorias de ayudas públicas (ICAA, televisiones, fondos europeos).

El tono debe ser:
- Profesional pero apasionado
- Concreto y específico
- Convincente para comités de evaluación
- En español de España

Genera contenido basado en los datos del proyecto proporcionados. Si hay contenido existente, mejóralo y expándelo manteniendo la esencia.`;

    const sectionPrompts: Record<string, string> = {
      director_intentions: `Redacta las INTENCIONES DEL DIRECTOR para este proyecto cinematográfico.
Incluye: visión artística, por qué esta historia ahora, qué quiere transmitir al espectador, referencias visuales/narrativas.
Extensión: 2-3 párrafos convincentes.`,
      
      artistic_vision: `Redacta la VISIÓN ARTÍSTICA del proyecto.
Incluye: estética visual, tono narrativo, atmósfera, paleta de colores, estilo cinematográfico.
Extensión: 2-3 párrafos.`,
      
      personal_connection: `Redacta la CONEXIÓN PERSONAL del equipo con esta historia.
Incluye: motivación personal, por qué este proyecto es importante, experiencias relacionadas.
Extensión: 1-2 párrafos emotivos pero profesionales.`,
      
      target_audience: `Define el PÚBLICO OBJETIVO de este proyecto.
Incluye: demografía, gustos, por qué conectará con ellos, comparables de mercado.
Extensión: 1-2 párrafos.`,
      
      aesthetic_proposal: `Desarrolla la PROPUESTA ESTÉTICA completa.
Incluye: dirección de fotografía, dirección de arte, vestuario, localizaciones, efectos.
Extensión: 2-3 párrafos detallados.`,
      
      production_viability: `Argumenta la VIABILIDAD DE PRODUCCIÓN del proyecto.
Incluye: experiencia del equipo, plan de rodaje, presupuesto realista, coproducciones, ventanas de explotación.
Extensión: 2-3 párrafos.`,
      
      team_strengths: `Destaca las FORTALEZAS DEL EQUIPO.
Incluye: trayectoria, premios, proyectos anteriores, por qué son ideales para este proyecto.
Extensión: 1-2 párrafos.`,
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
