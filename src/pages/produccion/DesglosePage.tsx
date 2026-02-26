import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ProductionLayout from '@/components/layout/ProductionLayout';
import { useProject } from '@/hooks/useProject';
import { useSequences, useCreateSequence, useUpdateSequence, useDeleteSequence } from '@/hooks/useSequences';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Film, ListChecks, Hash } from 'lucide-react';
import SequenceDialog from '@/components/features/SequenceDialog';
import {
  calcularScoreComplejidad,
  obtenerCategoria,
  colorCategoria,
  crearFactoresVacios,
  type ComplejidadFactores,
} from '@/utils/complejidad';
import type { SequenceRow } from '@/hooks/useSequences';
import type { Json } from '@/integrations/supabase/types';

export default function DesglosePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: sequences = [], isLoading: loadingSeqs } = useSequences(projectId);

  const createSeq = useCreateSequence();
  const updateSeq = useUpdateSequence();
  const deleteSeq = useDeleteSequence();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeq, setEditingSeq] = useState<SequenceRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = loadingProject || loadingSeqs;

  const locations = project?.locations || [];
  const characters = project?.characters || [];

  // Stats
  const totalOctavos = sequences.reduce((sum, s) => sum + (Number(s.page_eighths) || 0), 0);
  const avgScore = sequences.length
    ? Math.round(sequences.reduce((sum, s) => {
        const cf = s.complejidad_factores;
        const f = cf && typeof cf === 'object' ? { ...crearFactoresVacios(), ...(cf as ComplejidadFactores) } : crearFactoresVacios();
        return sum + calcularScoreComplejidad(f);
      }, 0) / sequences.length)
    : 0;

  const handleSave = (data: {
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
  }) => {
    if (!projectId) return;
    const payload = {
      project_id: projectId,
      sequence_number: data.sequence_number,
      title: data.title,
      description: data.description,
      int_ext: data.int_ext,
      time_of_day: data.time_of_day,
      page_eighths: data.page_eighths,
      location_id: data.location_id,
      characters_in_scene: data.characters_in_scene as unknown as Json,
      scene_complexity: data.scene_complexity,
      complejidad_factores: data.complejidad_factores as unknown as Json,
    };

    if (editingSeq) {
      updateSeq.mutate({ id: editingSeq.id, projectId, data: payload });
    } else {
      createSeq.mutate(payload);
    }
    setEditingSeq(null);
  };

  const handleEdit = (seq: SequenceRow) => {
    setEditingSeq(seq);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSeq(null);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId && projectId) {
      deleteSeq.mutate({ id: deleteId, projectId });
      setDeleteId(null);
    }
  };

  const getLocationName = (locId: string | null) => {
    if (!locId) return '—';
    return locations.find((l) => l.id === locId)?.name || '—';
  };

  const getCharNames = (charIds: Json) => {
    if (!Array.isArray(charIds) || charIds.length === 0) return '—';
    return (charIds as string[])
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '—';
  };

  const getSeqScore = (seq: SequenceRow) => {
    const cf = seq.complejidad_factores;
    const f = cf && typeof cf === 'object' ? { ...crearFactoresVacios(), ...(cf as ComplejidadFactores) } : crearFactoresVacios();
    return calcularScoreComplejidad(f);
  };

  const nextNumber = sequences.length ? Math.max(...sequences.map((s) => s.sequence_number)) + 1 : 1;

  return (
    <ProductionLayout projectTitle={project?.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="section-header">
            <div className="section-header-icon">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Desglose de Guión</h2>
              <p className="text-sm text-muted-foreground">Secuencias, complejidad y asignaciones</p>
            </div>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Secuencia
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <ListChecks className="w-4 h-4" /> Total secuencias
            </div>
            <p className="text-2xl font-bold">{sequences.length}</p>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Hash className="w-4 h-4" /> Total octavos
            </div>
            <p className="text-2xl font-bold">{totalOctavos}</p>
          </div>
          <div className="stats-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Film className="w-4 h-4" /> Media complejidad
            </div>
            <p className="text-2xl font-bold">{avgScore}</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sequences.length === 0 ? (
          <Alert>
            <AlertDescription>
              No hay secuencias. Sube un guión para analizarlo automáticamente o añade secuencias manualmente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Encabezado</TableHead>
                  <TableHead className="w-20">INT/EXT</TableHead>
                  <TableHead className="w-24">Momento</TableHead>
                  <TableHead className="w-20 text-right">Octavos</TableHead>
                  <TableHead className="w-28">Complejidad</TableHead>
                  <TableHead>Localización</TableHead>
                  <TableHead>Personajes</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((seq) => {
                  const score = getSeqScore(seq);
                  const cat = obtenerCategoria(score);
                  return (
                    <TableRow
                      key={seq.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEdit(seq)}
                    >
                      <TableCell className="font-mono font-bold">{seq.sequence_number}</TableCell>
                      <TableCell className="font-medium">{seq.title || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{seq.int_ext || 'INT'}</Badge>
                      </TableCell>
                      <TableCell>{seq.time_of_day || 'DIA'}</TableCell>
                      <TableCell className="text-right font-mono">{seq.page_eighths}</TableCell>
                      <TableCell>
                        <Badge className={colorCategoria(cat)}>
                          {score} · {cat}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getLocationName(seq.location_id)}</TableCell>
                      <TableCell className="text-sm truncate max-w-[150px]">
                        {getCharNames(seq.characters_in_scene as Json)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(seq.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Sequence Dialog */}
      <SequenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sequence={editingSeq}
        locations={locations}
        characters={characters}
        nextNumber={nextNumber}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar secuencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La secuencia será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProductionLayout>
  );
}
