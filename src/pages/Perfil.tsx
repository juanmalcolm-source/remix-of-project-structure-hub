import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function Perfil() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();

  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [contactEmail, setContactEmail] = useState(profile?.contact_email || user?.email || '');
  const [contactPhone, setContactPhone] = useState(profile?.contact_phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    const { error } = await updateProfile({
      company_name: companyName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address: address,
    });

    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '✓ Perfil guardado',
        description: 'Los cambios se han guardado correctamente',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Perfil de Productora</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Datos de la Productora
              </CardTitle>
              <CardDescription>
                Estos datos aparecerán en los documentos exportados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    placeholder="Mi Productora S.L."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email de contacto</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contacto@productora.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Calle Principal, 123, Madrid"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
