import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ERRORES } from '@/constants/errors';

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

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setState(prev => ({ ...prev, progreso: 10 }));
    
    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      setState(prev => ({ ...prev, progreso: 30 }));

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: formData,
      });

      setState(prev => ({ ...prev, progreso: 90 }));

      if (error) {
        throw new Error(error.message || 'Error al procesar el PDF');
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al extraer texto del PDF');
      }

      setState(prev => ({ ...prev, progreso: 95 }));
      return data.text;
    } catch (error) {
      console.error('Error in extractTextFromPDF:', error);
      throw error;
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
