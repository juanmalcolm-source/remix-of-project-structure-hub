import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateWithAI, extractJson } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Loader2, Sparkles, X } from 'lucide-react';

const AMBITOS = [
  { value: 'estatal', label: 'Estatal' },
  { value: 'autonomica', label: 'Autonómica' },
  { value: 'europea', label: 'Europea' },
  { value: 'iberoamericana', label: 'Iberoamericana' },
  { value: 'privada', label: 'Privada' },
];

const TIPOS_OBRA = ['largometraje', 'cortometraje', 'documental', 'produccion', 'distribucion', 'guion', 'animacion', 'serie'];

interface UploadBasesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type Step = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'saving';

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  uploading: 'Subiendo PDF...',
  extracting: 'Extrayendo texto...',
  analyzing: 'Analizando con IA...',
  saving: 'Guardando convocatoria...',
};

export default function UploadBasesDialog({ open, onOpenChange, onCreated }: UploadBasesDialogProps) {
  const { toast } = useToast();

  // Form fields
  const [nombre, setNombre] = useState('');
  const [organismo, setOrganismo] = useState('');
  const [ambito, setAmbito] = useState('estatal');
  const [tiposObra, setTiposObra] = useState<string[]>([]);
  const [dotacion, setDotacion] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [url, setUrl] = useState('');

  // File/text
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [tab, setTab] = useState('pdf');

  // Processing
  const [step, setStep] = useState<Step>('idle');
  const processing = step !== 'idle';

  const toggleTipo = (t: string) => setTiposObra(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const resetForm = () => {
    setNombre(''); setOrganismo(''); setAmbito('estatal'); setTiposObra([]);
    setDotacion(''); setFechaApertura(''); setFechaCierre(''); setUrl('');
    setFile(null); setPastedText(''); setStep('idle'); setTab('pdf');
  };

  const handleSubmit = async () => {
    try {
      let pdfUrl: string | null = null;
      let extractedText = '';

      // Step 1: Upload PDF if present
      if (tab === 'pdf' && file) {
        setStep('uploading');
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('convocatoria-docs')
          .upload(fileName, file, { contentType: 'application/pdf' });
        if (uploadError) throw new Error(`Error al subir PDF: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('convocatoria-docs').getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;

        // Step 2: Extract text
        setStep('extracting');
        const formData = new FormData();
        formData.append('file', file);

        const extractResp = await supabase.functions.invoke('extract-pdf-text', {
          body: formData,
        });

        if (extractResp.error) throw new Error(`Error extrayendo texto: ${extractResp.error.message}`);
        if (!extractResp.data?.success) throw new Error(extractResp.data?.error || 'Error extrayendo texto del PDF');
        extractedText = extractResp.data.text;
      } else if (tab === 'text' && pastedText.trim()) {
        extractedText = pastedText.trim();
      }

      // Step 3: Analyze with AI if we have text
      let basesResumen: any = null;
      if (extractedText.length > 50) {
        setStep('analyzing');
        const truncated = extractedText.slice(0, 12000);
        const aiText = await generateWithAI({
          prompt: `Analiza las siguientes bases de convocatoria y extrae la información:\n\n${truncated}`,
          systemPrompt: `Eres un experto en convocatorias de ayudas al cine español y europeo. Analiza las bases de esta convocatoria y extrae la información en formato JSON. Devuelve SOLO un JSON (sin texto adicional) con: { "nombre": string, "organismo": string, "ambito": "estatal"|"autonomica"|"europea"|"iberoamericana"|"privada", "descripcion": string (resumen 2-3 frases), "requisitos": string[] (requisitos principales), "tipos_obra": string[], "dotacion_total": number|null (en euros), "fecha_apertura": string|null (ISO date YYYY-MM-DD), "fecha_cierre": string|null (ISO date YYYY-MM-DD), "url_oficial": string|null, "criterios_valoracion": string[], "documentacion_requerida": string[], "notas_importantes": string[] }`,
          maxTokens: 2048,
        });

        basesResumen = extractJson(aiText);

        // Auto-fill empty fields from AI
        if (!nombre && basesResumen.nombre) setNombre(basesResumen.nombre);
        if (!organismo && basesResumen.organismo) setOrganismo(basesResumen.organismo);
        if (basesResumen.ambito) setAmbito(basesResumen.ambito);
        if (!tiposObra.length && basesResumen.tipos_obra) setTiposObra(basesResumen.tipos_obra);
        if (!dotacion && basesResumen.dotacion_total) setDotacion(String(basesResumen.dotacion_total));
        if (!fechaApertura && basesResumen.fecha_apertura) setFechaApertura(basesResumen.fecha_apertura);
        if (!fechaCierre && basesResumen.fecha_cierre) setFechaCierre(basesResumen.fecha_cierre);
        if (!url && basesResumen.url_oficial) setUrl(basesResumen.url_oficial);
      }

      // Step 4: Save to DB
      setStep('saving');
      const finalNombre = nombre || basesResumen?.nombre || 'Nueva convocatoria';
      const finalOrganismo = organismo || basesResumen?.organismo || 'Sin organismo';

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('convocatorias').insert({
        nombre: finalNombre,
        organismo: finalOrganismo,
        ambito,
        tipos_obra: tiposObra.length ? tiposObra : (basesResumen?.tipos_obra || null),
        dotacion: dotacion ? Number(dotacion) : (basesResumen?.dotacion_total || null),
        fecha_apertura: fechaApertura || basesResumen?.fecha_apertura || null,
        fecha_cierre: fechaCierre || basesResumen?.fecha_cierre || null,
        url: url || basesResumen?.url_oficial || null,
        descripcion: basesResumen?.descripcion || null,
        requisitos: basesResumen?.requisitos?.join('\n') || null,
        activa: true,
        bases_pdf_url: pdfUrl,
        bases_texto_extraido: extractedText || null,
        bases_resumen: basesResumen || null,
        created_by: user?.id || null,
      } as any);

      if (insertError) throw new Error(`Error guardando: ${insertError.message}`);

      toast({ title: 'Convocatoria creada', description: `"${finalNombre}" añadida a la biblioteca` });
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setStep('idle');
    }
  };

  const canSubmit = (tab === 'pdf' && file) || (tab === 'text' && pastedText.trim().length > 20) || (nombre.trim() && organismo.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!processing) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Nueva Convocatoria
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="pdf" className="flex-1"><FileText className="w-4 h-4 mr-1" />Subir PDF</TabsTrigger>
            <TabsTrigger value="text" className="flex-1"><FileText className="w-4 h-4 mr-1" />Pegar texto</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-3 mt-3">
            <div>
              <Label>Archivo PDF de las bases (máx. 10MB)</Label>
              {file ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg mt-1">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg mt-1 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground">Haz clic o arrastra un PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 10 * 1024 * 1024) {
                          toast({ title: 'Archivo demasiado grande', description: 'El máximo es 10MB', variant: 'destructive' });
                          return;
                        }
                        setFile(f);
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Se extraerá el texto automáticamente y se analizará con IA para rellenar los campos.</p>
          </TabsContent>

          <TabsContent value="text" className="space-y-3 mt-3">
            <div>
              <Label>Pega aquí el texto de las bases</Label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={8}
                placeholder="Copia y pega el texto completo de las bases de la convocatoria..."
                className="mt-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Pega el contenido de las bases y se analizará con IA.</p>
          </TabsContent>
        </Tabs>

        {/* Editable fields */}
        <div className="space-y-3 border-t pt-4 mt-2">
          <p className="text-xs text-muted-foreground font-medium">Campos editables (se rellenan automáticamente con IA si subes bases)</p>
          <div>
            <Label>Nombre de la convocatoria</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ayudas ICAA 2025" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Organismo</Label>
              <Input value={organismo} onChange={(e) => setOrganismo(e.target.value)} placeholder="Ej: ICAA" />
            </div>
            <div>
              <Label>Ámbito</Label>
              <Select value={ambito} onValueChange={setAmbito}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AMBITOS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tipos de obra</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {TIPOS_OBRA.map(t => (
                <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={tiposObra.includes(t)} onCheckedChange={() => toggleTipo(t)} />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Dotación (€)</Label>
              <Input type="number" value={dotacion} onChange={(e) => setDotacion(e.target.value)} placeholder="150000" />
            </div>
            <div>
              <Label>Apertura</Label>
              <Input type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} />
            </div>
            <div>
              <Label>Cierre</Label>
              <Input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>URL oficial</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={processing}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || processing}>
            {processing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{STEP_LABELS[step]}</>
            ) : (tab === 'pdf' && file) || (tab === 'text' && pastedText.trim()) ? (
              <><Sparkles className="w-4 h-4 mr-2" />Subir y Analizar con IA</>
            ) : (
              'Crear Convocatoria'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
