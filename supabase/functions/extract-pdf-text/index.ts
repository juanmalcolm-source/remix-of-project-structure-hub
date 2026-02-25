import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import pdf from "npm:pdf-parse@1.1.1/lib/pdf-parse.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Received PDF extraction request');

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('Extracting text with pdf-parse...');
    const data = await pdf(buffer);

    const fullText = data.text;
    const numPages = data.numpages;

    console.log(`Extraction complete. Pages: ${numPages}, Text length: ${fullText.length}`);

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('No se pudo extraer texto del PDF. El documento podría estar vacío o ser una imagen escaneada.');
    }

    if (fullText.trim().length < 50) {
      throw new Error('El texto extraído es demasiado corto. Verifica que el PDF contenga texto legible.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: fullText.trim(),
        numPages: numPages,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error extracting PDF text:', error);

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar PDF';

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
