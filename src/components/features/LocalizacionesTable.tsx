import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Localizacion } from '@/types/analisisGuion';

interface LocalizacionesTableProps {
  localizaciones: Localizacion[];
  onEdit?: (localizacion: Localizacion) => void;
}

type SortKey = keyof Localizacion | 'none';
type SortDirection = 'asc' | 'desc';

export default function LocalizacionesTable({ localizaciones, onEdit }: LocalizacionesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
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

  const filteredAndSortedLocalizaciones = useMemo(() => {
    let result = [...localizaciones];

    // Filtrar por búsqueda
    if (searchTerm) {
      result = result.filter(loc =>
        loc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (tipoFilter !== 'all') {
      result = result.filter(loc => loc.tipo === tipoFilter);
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
  }, [localizaciones, searchTerm, tipoFilter, sortKey, sortDirection]);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'INT': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'EXT': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplejidadColor = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'Media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'Alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMomentoDiaColor = (momento: string) => {
    switch (momento) {
      case 'DÍA': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'NOCHE': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'ATARDECER': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'AMANECER': return 'bg-pink-500/10 text-pink-700 dark:text-pink-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
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
        
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="INT">Interiores</SelectItem>
            <SelectItem value="EXT">Exteriores</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline">
          {filteredAndSortedLocalizaciones.length} de {localizaciones.length}
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
                  onClick={() => handleSort('tipo')}
                  className="h-8 px-2"
                >
                  Tipo
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Momento</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('escenas')}
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
                  onClick={() => handleSort('paginas_totales')}
                  className="h-8 px-2"
                >
                  Páginas
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
                  onClick={() => handleSort('complejidad')}
                  className="h-8 px-2"
                >
                  Complejidad
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLocalizaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron localizaciones
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedLocalizaciones.map((loc, index) => (
                <TableRow key={index} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{loc.nombre}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {loc.descripcion}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTipoColor(loc.tipo)}>
                      {loc.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMomentoDiaColor(loc.momento_dia)}>
                      {loc.momento_dia}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{loc.escenas.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{loc.paginas_totales}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{loc.dias_rodaje_estimados}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getComplejidadColor(loc.complejidad)}>
                      {loc.complejidad}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Agrupación por tipo */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Badge className={getTipoColor('INT')}>INT</Badge>
            Interiores
          </h4>
          <p className="text-2xl font-bold">
            {localizaciones.filter(l => l.tipo === 'INT').length}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Badge className={getTipoColor('EXT')}>EXT</Badge>
            Exteriores
          </h4>
          <p className="text-2xl font-bold">
            {localizaciones.filter(l => l.tipo === 'EXT').length}
          </p>
        </div>
      </div>
    </div>
  );
}
