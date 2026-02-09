import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SequenceRow } from '@/hooks/useSequences';
import type { Tables } from '@/integrations/supabase/types';
import {
  crearFactoresVacios,
  calcularScoreComplejidad,
  obtenerCategoria,
  colorCategoria,
  FACTORES_LABELS,
  type ComplejidadFactores,
} from '@/utils/complejidad';

type LocationRow = Tables<'locations'>;
type CharacterRow = Tables<'characters'>;

interface SequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequence?: SequenceRow | null;
  locations: LocationRow[];
  characters: CharacterRow[];
  nextNumber: number;
  onSave: (data: {
    sequence_number: number;
    title: string;
    description: string;
    int_ext: string;
    time_of_day: string;
    page_eighths: number;
    location_id: string | null;
    characters_in_scene: string[];
    dia_ficcion: number | null;
    complejidad_factores: ComplejidadFactores;
    scene_complexity: string;
  }) => void;
}

const BOOL_FACTOR_KEYS: (keyof ComplejidadFactores)[] = [
  'movimiento_camara', 'accion_fisica', 'stunts', 'efectos_especiales',
  'ninos', 'animales', 'vehiculos_movimiento', 'iluminacion_compleja',
  'escena_noche', 'exteriores_clima', 'dialogo_extenso', 'requiere_grua',
  'planos_especiales',
];

export default function SequenceDialog({
  open, onOpenChange, sequence, locations, characters, nextNumber, onSave,
}: SequenceDialogProps) {
  const [num, setNum] = useState(nextNumber);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [intExt, setIntExt] = useState('INT');
  const [timeOfDay, setTimeOfDay] = useState('DIA');
  const [octavos, setOctavos] = useState(1);
  const [locationId, setLocationId] = useState<string>('none');
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [diaFiccion, setDiaFiccion] = useState<string>('');
  const [factores, setFactores] = useState<ComplejidadFactores>(crearFactoresVacios());

  useEffect(() => {
    if (sequence) {
      setNum(sequence.sequence_number);
      setTitle(sequence.title || '');
      setDescription(sequence.description || '');
      setIntExt((sequence as any).int_ext || 'INT');
      setTimeOfDay(sequence.time_of_day || 'DIA');
      setOctavos(Number(sequence.page_eighths) || 1);
      setLocationId(sequence.location_id || 'none');
      const chars = sequence.characters_in_scene;
      setSelectedChars(Array.isArray(chars) ? (chars as string[]) : []);
      setDiaFiccion((sequence as any).dia_ficcion?.toString() || '');
      const cf = (sequence as any).complejidad_factores;
      setFactores(cf && typeof cf === 'object' ? { ...crearFactoresVacios(), ...cf } : crearFactoresVacios());
    } else {
      setNum(nextNumber);
      setTitle('');
      setDescription('');
      setIntExt('INT');
      setTimeOfDay('DIA');
      setOctavos(1);
      setLocationId('none');
      setSelectedChars([]);
      setDiaFiccion('');
      setFactores(crearFactoresVacios());
    }
  }, [sequence, nextNumber, open]);

  const score = useMemo(() => calcularScoreComplejidad(factores), [factores]);
  const cat = obtenerCategoria(score);

  const toggleChar = (charId: string) => {
    setSelectedChars((prev) =>
      prev.includes(charId) ? prev.filter((c) => c !== charId) : [...prev, charId]
    );
  };

  const toggleBoolFactor = (key: keyof ComplejidadFactores) => {
    setFactores((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    onSave({
      sequence_number: num,
      title,
      description,
      int_ext: intExt,
      time_of_day: timeOfDay,
      page_eighths: octavos,
      location_id: locationId === 'none' ? null : locationId,
      characters_in_scene: selectedChars,
      dia_ficcion: diaFiccion ? parseInt(diaFiccion) : null,
      complejidad_factores: factores,
      scene_complexity: cat,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sequence ? 'Editar Secuencia' : 'Nueva Secuencia'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Numero + INT/EXT + Momento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Nº Secuencia</Label>
              <Input type="number" min={1} value={num} onChange={(e) => setNum(parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <Label>INT / EXT</Label>
              <Select value={intExt} onValueChange={setIntExt}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INT">INT</SelectItem>
                  <SelectItem value="EXT">EXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Momento del día</Label>
              <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIA">DÍA</SelectItem>
                  <SelectItem value="NOCHE">NOCHE</SelectItem>
                  <SelectItem value="ATARDECER">ATARDECER</SelectItem>
                  <SelectItem value="AMANECER">AMANECER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Encabezado / Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: CASA DE MARÍA - SALÓN" />
          </div>

          {/* Description */}
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          {/* Row: Octavos + Día ficción */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Octavos de página</Label>
              <Input type="number" min={0.5} step={0.5} value={octavos} onChange={(e) => setOctavos(parseFloat(e.target.value) || 1)} />
            </div>
            <div>
              <Label>Día de ficción</Label>
              <Input type="number" min={1} value={diaFiccion} onChange={(e) => setDiaFiccion(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label>Localización</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Characters */}
          <div>
            <Label>Personajes en escena</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {characters.map((ch) => (
                <Badge
                  key={ch.id}
                  variant={selectedChars.includes(ch.id) ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleChar(ch.id)}
                >
                  {ch.name}
                </Badge>
              ))}
              {characters.length === 0 && (
                <span className="text-sm text-muted-foreground">No hay personajes en el proyecto</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Complexity Factors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Factores de Complejidad</Label>
              <Badge className={colorCategoria(cat)}>
                Score: {score} — {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BOOL_FACTOR_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <Checkbox
                    checked={factores[key] as boolean}
                    onCheckedChange={() => toggleBoolFactor(key)}
                  />
                  {FACTORES_LABELS[key]}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label className="text-xs">{FACTORES_LABELS.num_personajes}</Label>
                <Input
                  type="number" min={0}
                  value={factores.num_personajes}
                  onChange={(e) => setFactores((f) => ({ ...f, num_personajes: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">{FACTORES_LABELS.num_extras}</Label>
                <Input
                  type="number" min={0}
                  value={factores.num_extras}
                  onChange={(e) => setFactores((f) => ({ ...f, num_extras: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{sequence ? 'Guardar' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
