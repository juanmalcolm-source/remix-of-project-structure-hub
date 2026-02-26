import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ERRORES } from '@/constants/errors';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js usando resolución de Vite (no CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];

interface FileUploadState {
  archivo: File | null;
  textoExtraido: string;
  isLoading: boolean;
  error: string | null;
  progreso: number;
}

export const useFileUpload = () => {
  const { toast } = useToast();
  const [state, setState] = useState<FileUploadState>({
    archivo: null,
    textoExtraido: '',
    isLoading: false,
    error: null,
    progreso: 0,
  });

  /**
   * Extrae texto de un PDF directamente en el navegador usando pdf.js
   * Sin necesidad de edge functions ni servidores externos
   */
  const extractTextFromPDF = async (file: File): Promise<string> => {
    setState(prev => ({ ...prev, progreso: 10 }));

    try {
      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setState(prev => ({ ...prev, progreso: 20 }));

      // Cargar el documento PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      setState(prev => ({ ...prev, progreso: 30 }));

      // Extraer texto de cada página
      const textParts: string[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Reconstruir texto con saltos de línea apropiados
        let lastY: number | null = null;
        let pageText = '';

        for (const item of textContent.items) {
          if ('str' in item) {
            const currentY = item.transform[5];
            // Si cambió la posición Y, es una nueva línea
            if (lastY !== null && Math.abs(currentY - lastY) > 2) {
              pageText += '\n';
            }
            pageText += item.str;
            lastY = currentY;
          }
        }

        textParts.push(pageText);

        // Actualizar progreso (30% a 90% durante extracción)
        const extractionProgress = 30 + Math.round((pageNum / totalPages) * 60);
        setState(prev => ({ ...prev, progreso: extractionProgress }));
      }

      setState(prev => ({ ...prev, progreso: 95 }));

      // Unir todas las páginas
      return textParts.join('\n\n');

    } catch (error) {
      console.error('Error extrayendo texto del PDF:', error);
      throw new Error('Error al procesar el PDF. Verifica que no esté protegido o corrupto.');
    }
  };

  const extractTextFromTXT = async (file: File): Promise<string> => {
    setState(prev => ({ ...prev, progreso: 30 }));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setState(prev => ({ ...prev, progreso: 90 }));
        const text = e.target?.result as string;
        resolve(text.trim());
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return ERRORES.FORMATO_INVALIDO;
    }

    if (file.size > MAX_FILE_SIZE) {
      return ERRORES.TAMANO_EXCEDIDO;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, progreso: 0 }));

    try {
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      let extractedText = '';

      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        extractedText = await extractTextFromTXT(file);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error(ERRORES.TEXTO_VACIO);
      }

      if (extractedText.trim().length < 50) {
        throw new Error(ERRORES.SIN_CONTENIDO);
      }

      setState({
        archivo: file,
        textoExtraido: extractedText,
        isLoading: false,
        error: null,
        progreso: 100,
      });

      toast({
        title: 'Archivo procesado',
        description: `${file.name} cargado correctamente`,
      });

      return extractedText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el archivo';

      setState({
        archivo: null,
        textoExtraido: '',
        isLoading: false,
        error: errorMessage,
        progreso: 0,
      });

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      throw error;
    }
  };

  const resetUpload = () => {
    setState({
      archivo: null,
      textoExtraido: '',
      isLoading: false,
      error: null,
      progreso: 0,
    });
  };

  return {
    archivo: state.archivo,
    textoExtraido: state.textoExtraido,
    isLoading: state.isLoading,
    error: state.error,
    progreso: state.progreso,
    handleFileSelect,
    resetUpload,
  };
};
