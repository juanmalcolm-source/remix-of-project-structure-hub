import * as pdfjsLib from 'pdfjs-dist';
import { ERRORES } from '@/constants/errors';

// Usar la versión correcta del worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface PDFExtractionResult {
  text: string;
  numPages: number;
  success: boolean;
  error?: string;
}

/**
 * Extrae texto de un archivo PDF página por página
 * @param file Archivo PDF a procesar
 * @param onProgress Callback opcional para reportar progreso (0-100)
 * @returns Resultado de la extracción con texto concatenado
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<PDFExtractionResult> {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(10);

    // Cargar el documento PDF
    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    } catch (error) {
      // Errores específicos de carga del PDF
      if (error instanceof Error) {
        if (error.message.includes('password')) {
          throw new Error(ERRORES.PDF_CORRUPTO);
        }
        if (error.message.includes('Invalid PDF')) {
          throw new Error(ERRORES.PDF_CORRUPTO);
        }
      }
      throw new Error(ERRORES.ERROR_LECTURA);
    }

    onProgress?.(30);

    const numPages = pdf.numPages;
    let fullText = '';
    const pageTexts: string[] = [];

    // Extraer texto de cada página
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Concatenar el texto de todos los items de la página
        const pageText = textContent.items
          .map((item: any) => {
            // Verificar que el item tenga la propiedad str
            return item.str || '';
          })
          .filter(str => str.trim().length > 0) // Filtrar strings vacíos
          .join(' ');
        
        if (pageText.trim()) {
          pageTexts.push(pageText);
        }

        // Calcular progreso (30% inicial + 65% del procesamiento de páginas)
        const progress = 30 + Math.floor((pageNum / numPages) * 65);
        onProgress?.(progress);
      } catch (error) {
        console.warn(`Error extrayendo texto de página ${pageNum}:`, error);
        // Continuar con las demás páginas
      }
    }

    // Unir todo el texto con saltos de línea entre páginas
    fullText = pageTexts.join('\n\n');

    onProgress?.(100);

    if (!fullText.trim()) {
      return {
        text: '',
        numPages,
        success: false,
        error: ERRORES.TEXTO_VACIO,
      };
    }

    return {
      text: fullText.trim(),
      numPages,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar PDF';
    
    return {
      text: '',
      numPages: 0,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Valida si un archivo es un PDF válido
 * @param file Archivo a validar
 * @returns true si es un PDF válido
 */
export function isValidPDF(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Verifica si un PDF está protegido con contraseña
 * @param file Archivo PDF a verificar
 * @returns true si está protegido
 */
export async function isPDFPasswordProtected(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return false;
  } catch (error) {
    if (error instanceof Error && error.message.includes('password')) {
      return true;
    }
    return false;
  }
}
