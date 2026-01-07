import { useNavigate } from 'react-router-dom';
import { Film, Sparkles, ArrowRight, BarChart3, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: FileText,
      title: 'Análisis de Guiones',
      description: 'Extrae personajes, localizaciones y estructura narrativa automáticamente con IA',
    },
    {
      icon: BarChart3,
      title: 'Viabilidad de Producción',
      description: 'Evalúa la complejidad y estima presupuestos basándote en datos reales',
    },
    {
      icon: Users,
      title: 'Gestión de Personajes',
      description: 'Organiza el elenco, arcos dramáticos y propuestas de casting',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cinema-midnight via-cinema-navy to-cinema-slate opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        
        {/* Content */}
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold font-medium">Potenciado por IA</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Análisis de guiones para{' '}
              <span className="text-gradient-gold">profesionales del cine</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Fractal Kit transforma tu guión en un dossier de producción completo. 
              Personajes, localizaciones, viabilidad y financiación en un solo lugar.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button 
                  size="lg" 
                  onClick={() => navigate('/proyectos')}
                  className="btn-gold text-lg px-8 py-6"
                >
                  Ir a Proyectos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="btn-gold text-lg px-8 py-6"
                  >
                    Comenzar Gratis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10"
                  >
                    Iniciar Sesión
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Decorative Film Icon */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block opacity-10">
            <Film className="w-96 h-96 text-gold" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas para producir
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Desde el primer análisis hasta el plan de financiación, 
            Fractal Kit te acompaña en cada paso del desarrollo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="card-cinematic p-8 text-center group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            ¿Listo para transformar tu próximo proyecto?
          </h2>
          <p className="text-muted-foreground mb-8">
            Únete a productoras que ya usan Fractal Kit para desarrollar sus películas.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate(user ? '/proyectos' : '/auth')}
            className="btn-gold"
          >
            {user ? 'Ver Proyectos' : 'Empezar Ahora'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" />
            <span className="font-display font-semibold">Fractal Kit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Fractal Kit. Análisis de guiones con IA.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;