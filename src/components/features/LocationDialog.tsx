import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LocationRow } from '@/hooks/useLocations';

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: LocationRow | null;
  onSave: (data: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    production_notes: string | null;
    zone: string | null;
  }) => void;
}

export default function LocationDialog({ open, onOpenChange, location, onSave }: LocationDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [zone, setZone] = useState('');

  useEffect(() => {
    if (location) {
      setName(location.name);
      setAddress(location.address || '');
      setLat(location.latitude?.toString() || '');
      setLng(location.longitude?.toString() || '');
      setNotes(location.production_notes || '');
      setZone(location.zone || '');
    } else {
      setName('');
      setAddress('');
      setLat('');
      setLng('');
      setNotes('');
      setZone('');
    }
  }, [location, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      address: address || null,
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
      production_notes: notes || null,
      zone: zone || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{location ? 'Editar Localización' : 'Nueva Localización'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Casa de María" />
          </div>

          <div>
            <Label>Dirección</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, ciudad..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Latitud</Label>
              <Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="40.4168" />
            </div>
            <div>
              <Label>Longitud</Label>
              <Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-3.7038" />
            </div>
          </div>

          <div>
            <Label>Zona geográfica</Label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ej: Centro Madrid, Sierra Norte..." />
          </div>

          <div>
            <Label>Notas de producción</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Permisos, restricciones horarias, parking..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{location ? 'Guardar' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
