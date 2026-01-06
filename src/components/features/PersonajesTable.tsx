import { useState, useMemo } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Personaje } from '@/types/analisisGuion';

interface PersonajesTableProps {
  personajes: Personaje[];
  onEdit?: (personaje: Personaje) => void;
}

type SortKey = keyof Personaje | 'none';
type SortDirection = 'asc' | 'desc';

export default function PersonajesTable({ personajes, onEdit }: PersonajesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedPersonajes = useMemo(() => {
    let result = [...personajes];

    // Filtrar
    if (searchTerm) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    if (sortKey !== 'none') {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (Array.isArray(aVal) && Array.isArray(bVal)) {
          return sortDirection === 'asc' 
            ? aVal.length - bVal.length 
            : bVal.length - aVal.length;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [personajes, searchTerm, sortKey, sortDirection]);

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'PROTAGONISTA': return 'bg-primary text-primary-foreground';
      case 'PRINCIPAL': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'SECUNDARIO': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'FIGURACION': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImportanciaColor = (importancia: string) => {
    switch (importancia) {
      case 'Alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'Media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Baja': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">
          {filteredAndSortedPersonajes.length} de {personajes.length}
        </Badge>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('nombre')}
                  className="h-8 px-2"
                >
                  Nombre
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('categoria')}
                  className="h-8 px-2"
                >
                  Categoría
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Género</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('edad_aproximada')}
                  className="h-8 px-2"
                >
                  Edad
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('escenas_aparicion')}
                  className="h-8 px-2"
                >
                  Escenas
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('dias_rodaje_estimados')}
                  className="h-8 px-2"
                >
                  Días
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('importancia_trama')}
                  className="h-8 px-2"
                >
                  Importancia
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedPersonajes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron personajes
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPersonajes.map((personaje, index) => (
                <TableRow key={index} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{personaje.nombre}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {personaje.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoriaColor(personaje.categoria)}>
                      {personaje.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>{personaje.genero}</TableCell>
                  <TableCell>{personaje.edad_aproximada}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{personaje.escenas_aparicion.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{personaje.dias_rodaje_estimados}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getImportanciaColor(personaje.importancia_trama)}>
                      {personaje.importancia_trama}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
