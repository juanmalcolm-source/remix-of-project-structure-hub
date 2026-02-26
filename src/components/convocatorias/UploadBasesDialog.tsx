import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, Loader2, X } from 'lucide-react';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pdf.js loaded via CDN script tag, no TS types available
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = (window as Record<string, unknown>).pdfjsLib as
    | { GlobalWorkerOptions: { workerSrc: string }; getDocument: (opts: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str?: string }[] }> }> }> } }
    | undefined;
  if (!pdfjsLib) throw new Error('pdf.js no cargado');

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str || '').join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

export default function UploadBasesDialog({ open, onOpenChange, onCreated }: UploadBasesDialogProps) {
  const { toast } = useToast();

  const [nombre, setNombre] = useState('');
  const [organismo, setOrganismo] = useState('');
  const [ambito, setAmbito] = useState('estatal');
  const [tiposObra, setTiposObra] = useState<string[]>([]);
  const [dotacion, setDotacion] = useState('');
  const [fechaApertura, setFechaApertura] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');
  const [url, setUrl] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [tab, setTab] = useState('pdf');
  const [saving, setSaving] = useState(false);

  const toggleTipo = (t: string) => setTiposObra(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const resetForm = () => {
    setNombre(''); setOrganismo(''); setAmbito('estatal'); setTiposObra([]);
    setDotacion(''); setFechaApertura(''); setFechaCierre(''); setUrl('');
    setFile(null); setPastedText(''); setSaving(false); setTab('pdf');
  };

  const handleSubmit = async () => {
    console.log('1. Iniciando submit...');
    if (!nombre.trim() || !organismo.trim()) {
      toast({ title: 'Campos obligatorios', description: 'Rellena nombre y organismo', variant: 'destructive' });
      return;
    }

    setSaving(true);
    let extractedText = '';

    if (tab === 'pdf' && file) {
      try {
        console.log('2. Extrayendo texto del PDF...');
        extractedText = await extractPdfText(file);
        console.log('2b. Texto extraído:', extractedText.substring(0, 200));
      } catch (err: unknown) {
        console.error('Error extrayendo texto del PDF:', err);
        toast({ title: 'No se pudo extraer texto del PDF', description: 'La convocatoria se creará sin texto extraído.', variant: 'default' });
      }
    } else if (tab === 'text' && pastedText.trim()) {
      extractedText = pastedText.trim();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('3. Usuario:', user?.id ?? 'NO AUTENTICADO');

      if (!user) {
        toast({ title: 'Debes iniciar sesión', description: 'Inicia sesión para crear convocatorias.', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const payload = {
        nombre: nombre.trim(),
        organismo: organismo.trim(),
        ambito,
        tipos_obra: tiposObra.length ? tiposObra : null,
        dotacion: dotacion ? Number(dotacion) : null,
        fecha_apertura: fechaApertura || null,
        fecha_cierre: fechaCierre || null,
        url: url || null,
        activa: true,
        bases_texto_extraido: extractedText || null,
        created_by: user.id,
      };
      console.log('3b. Datos del formulario:', payload);

      const { error: insertError } = await supabase.from('convocatorias').insert(payload);
      console.log('4. Resultado:', insertError ? insertError.message : 'OK');

      if (insertError) throw new Error(insertError.message);

      toast({ title: 'Convocatoria creada', description: `"${nombre.trim()}" añadida a la biblioteca.` });
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Error guardando convocatoria:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido';
      const msg = errMsg.includes('row-level security')
        ? 'Debes iniciar sesión para crear convocatorias'
        : errMsg;
      toast({ title: 'Error al guardar', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Nueva Convocatoria
          </DialogTitle>
          <DialogDescription>Añade una nueva convocatoria a la biblioteca.</DialogDescription>
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
                        if (!nombre.trim()) {
                          setNombre(f.name.replace(/\.pdf$/i, ''));
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Se extraerá el texto del PDF en el navegador y se guardará junto a la convocatoria.</p>
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
          </TabsContent>
        </Tabs>

        {/* Form fields */}
        <div className="space-y-3 border-t pt-4 mt-2">
          <div>
            <Label>Nombre de la convocatoria *</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ayudas ICAA 2025" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Organismo *</Label>
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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : 'Crear Convocatoria'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
