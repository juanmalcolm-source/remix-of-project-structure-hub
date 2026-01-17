import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Calendar, MapPin, Sun, Moon, Sunrise, Sunset } from "lucide-react";

interface AddShootingDayDialogProps {
  locations: any[];
  existingDaysCount: number;
  onAddDay: (dayData: {
    location: string;
    locationId?: string;
    timeOfDay: string;
    notes?: string;
  }) => void;
  trigger?: React.ReactNode;
}

export function AddShootingDayDialog({
  locations,
  existingDaysCount,
  onAddDay,
  trigger,
}: AddShootingDayDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [customLocation, setCustomLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("DÍA");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const locationData = locations.find(l => l.id === selectedLocation);
    
    onAddDay({
      location: locationData?.name || customLocation || "Nueva localización",
      locationId: locationData?.id,
      timeOfDay,
      notes: notes || undefined,
    });
    
    // Reset form
    setSelectedLocation("");
    setCustomLocation("");
    setTimeOfDay("DÍA");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Jornada
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Añadir Nueva Jornada
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Day number preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-xs text-muted-foreground">DÍA</span>
              <span className="text-2xl font-bold text-primary">{existingDaysCount + 1}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Se añadirá al final del plan actual
            </div>
          </div>
          
          {/* Location selection */}
          <div className="grid gap-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localización
            </Label>
            
            {locations.length > 0 ? (
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar localización" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <Plus className="h-3 w-3 mr-1 inline" />
                    Otra localización...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            
            {(selectedLocation === "custom" || locations.length === 0) && (
              <Input
                id="customLocation"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Nombre de la localización"
              />
            )}
          </div>
          
          {/* Time of day */}
          <div className="grid gap-2">
            <Label>Momento del día</Label>
            <RadioGroup 
              value={timeOfDay} 
              onValueChange={setTimeOfDay}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="DÍA" id="dia" />
                <Label htmlFor="dia" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Día
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="NOCHE" id="noche" />
                <Label htmlFor="noche" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  Noche
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="ATARDECER" id="atardecer" />
                <Label htmlFor="atardecer" className="flex items-center gap-2 cursor-pointer">
                  <Sunset className="h-4 w-4 text-orange-500" />
                  Atardecer
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-muted cursor-pointer">
                <RadioGroupItem value="AMANECER" id="amanecer" />
                <Label htmlFor="amanecer" className="flex items-center gap-2 cursor-pointer">
                  <Sunrise className="h-4 w-4 text-pink-400" />
                  Amanecer
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales para este día..."
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Jornada
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
