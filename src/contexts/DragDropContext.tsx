import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DraggedScene {
  id: string;
  sequence_number: number;
  title: string;
  page_eighths: number;
  effectiveEighths?: number;
  characters: string[];
  fromDayNumber?: number; // null if from unassigned
}

interface DragDropContextType {
  draggedScene: DraggedScene | null;
  isDragging: boolean;
  startDrag: (scene: DraggedScene) => void;
  endDrag: () => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [draggedScene, setDraggedScene] = useState<DraggedScene | null>(null);

  const startDrag = useCallback((scene: DraggedScene) => {
    setDraggedScene(scene);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedScene(null);
  }, []);

  return (
    <DragDropContext.Provider 
      value={{ 
        draggedScene, 
        isDragging: draggedScene !== null,
        startDrag, 
        endDrag 
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}
