import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface ExercisePickerContextValue {
  selectedIds: string[];
  targetDayIndex: number | null;
  select: (exerciseId: string) => void;
  deselect: (exerciseId: string) => void;
  toggle: (exerciseId: string) => void;
  clear: () => void;
  getSelected: () => string[];
  setTargetDayIndex: (index: number | null) => void;
}

const ExercisePickerContext = createContext<ExercisePickerContextValue | undefined>(undefined);

export function ExercisePickerProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetDayIndex, setTargetDayIndex] = useState<number | null>(null);

  const select = useCallback((exerciseId: string) => {
    setSelectedIds((prev) => (prev.includes(exerciseId) ? prev : [...prev, exerciseId]));
  }, []);

  const deselect = useCallback((exerciseId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== exerciseId));
  }, []);

  const toggle = useCallback((exerciseId: string) => {
    setSelectedIds((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId],
    );
  }, []);

  const clear = useCallback(() => {
    setSelectedIds([]);
    setTargetDayIndex(null);
  }, []);

  const getSelected = useCallback(() => selectedIds, [selectedIds]);

  const value = useMemo(
    () => ({
      selectedIds,
      targetDayIndex,
      select,
      deselect,
      toggle,
      clear,
      getSelected,
      setTargetDayIndex,
    }),
    [selectedIds, targetDayIndex, select, deselect, toggle, clear, getSelected, setTargetDayIndex],
  );

  return (
    <ExercisePickerContext.Provider value={value}>{children}</ExercisePickerContext.Provider>
  );
}

export function useExercisePicker(): ExercisePickerContextValue {
  const context = useContext(ExercisePickerContext);
  if (!context) {
    throw new Error('useExercisePicker must be used within an ExercisePickerProvider');
  }
  return context;
}
