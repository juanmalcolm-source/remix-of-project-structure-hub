export const ERRORES = {
  FORMATO_INVALIDO: "Solo se aceptan archivos PDF o TXT",
  TAMANO_EXCEDIDO: "El archivo no puede superar 10MB",
  PDF_CORRUPTO: "El PDF está corrupto o protegido",
  TEXTO_VACIO: "No se pudo extraer texto del documento",
  SIN_CONTENIDO: "El documento parece estar vacío",
  ERROR_LECTURA: "Error al leer el archivo. Inténtalo de nuevo"
} as const;
