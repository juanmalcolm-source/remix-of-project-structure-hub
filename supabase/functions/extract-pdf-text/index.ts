import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocument } from 'https://esm.sh/pdfjs-serverless@0.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received PDF extraction request');
    
    // Get the PDF file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Loading PDF document...');
    
    // Load PDF using pdfjs-serverless
    const doc = await getDocument(uint8Array).promise;
    const numPages = doc.numPages;
    
    console.log(`PDF loaded. Total pages: ${numPages}`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
      
      console.log(`Extracted page ${i}/${numPages}`);
    }
    
    console.log(`Extraction complete. Text length: ${fullText.length}`);

    // Validate extracted text
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
