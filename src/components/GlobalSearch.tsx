import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Landmark, FileText, ListChecks, Palette, Clapperboard, Wallet, Megaphone, LayoutDashboard, Settings } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  label: string;
  category: string;
  path: string;
  icon: React.ElementType;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { projectId } = useParams();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const pid = projectId || '';

  // Static pages
  const pages: SearchResult[] = [
    { id: 'dashboard', label: 'Dashboard', category: 'Páginas', path: `/proyecto/${pid}/dashboard`, icon: LayoutDashboard },
    { id: 'creativa', label: 'Creativa - Overview', category: 'Páginas', path: `/proyecto/${pid}/overview`, icon: Palette },
    { id: 'produccion', label: 'Producción - Desglose', category: 'Páginas', path: `/produccion/${pid}/desglose`, icon: Clapperboard },
    { id: 'financiacion', label: 'Financiación - Resumen', category: 'Páginas', path: `/financiacion/${pid}/resumen`, icon: Wallet },
    { id: 'audiencias', label: 'Audiencias - Análisis', category: 'Páginas', path: `/audiencias/${pid}/analisis`, icon: Megaphone },
    { id: 'convocatorias', label: 'Convocatorias - Biblioteca', category: 'Páginas', path: `/convocatorias/${pid}/biblioteca`, icon: Landmark },
    { id: 'config', label: 'Configuración', category: 'Páginas', path: `/proyecto/${pid}/configuracion`, icon: Settings },
  ];

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !pid) {
      setResults(pages.filter((p) => !q.trim() || p.label.toLowerCase().includes(q.toLowerCase())));
      return;
    }

    const term = `%${q}%`;
    const [convRes, tareasRes] = await Promise.all([
      supabase.from('convocatorias').select('id, nombre').ilike('nombre', term).limit(5),
      supabase.from('tareas_solicitud').select('id, titulo').ilike('titulo', term).limit(5),
    ]);

    const dbResults: SearchResult[] = [];
    (convRes.data || []).forEach((c) => {
      dbResults.push({ id: c.id, label: c.nombre, category: 'Convocatorias', path: `/convocatorias/${pid}/biblioteca`, icon: Landmark });
    });
    (tareasRes.data || []).forEach((t) => {
      dbResults.push({ id: t.id, label: t.titulo, category: 'Tareas', path: `/convocatorias/${pid}/tareas`, icon: ListChecks });
    });

    const filteredPages = pages.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()));
    setResults([...filteredPages, ...dbResults]);
  }, [pid]);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, convocatorias, tareas..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Sin resultados</CommandEmpty>
        {Object.entries(grouped).map(([cat, items]) => (
          <CommandGroup key={cat} heading={cat}>
            {items.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item.path)} className="cursor-pointer">
                <item.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
