import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Exercise, MuscleGroup, Equipment } from '../../domain';
import {
  GetExercises,
  CreateExercise,
  UpdateExercise,
  DeleteExercise,
  ValidationError,
  NetworkError,
} from '../../domain';
import { FirestoreExerciseRepository } from '../../data';
import { useAuthContext } from '../context/AuthContext';

const exerciseRepository = new FirestoreExerciseRepository();
const getExercises = new GetExercises(exerciseRepository);
const createExerciseUseCase = new CreateExercise(exerciseRepository);
const updateExerciseUseCase = new UpdateExercise(exerciseRepository);
const deleteExerciseUseCase = new DeleteExercise(exerciseRepository);

export interface UseExercisesReturn {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  muscleGroupFilter: MuscleGroup | null;
  setMuscleGroupFilter: (group: MuscleGroup | null) => void;
  equipmentFilter: Equipment | null;
  setEquipmentFilter: (equipment: Equipment | null) => void;
  createExercise: (input: {
    name: string;
    muscleGroup: MuscleGroup;
    equipment: Equipment;
  }) => Promise<Exercise | null>;
  updateExercise: (
    exerciseId: string,
    input: Partial<{
      name: string;
      muscleGroup: MuscleGroup;
      equipment: Equipment;
    }>,
  ) => Promise<Exercise | null>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

function getSpanishErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const messages: string[] = [];
    if (error.fields.name) {
      if (error.fields.name.includes('required')) {
        messages.push('El nombre es obligatorio');
      } else if (error.fields.name.includes('at least 2')) {
        messages.push('El nombre debe tener al menos 2 caracteres');
      } else if (error.fields.name.includes('at most 100')) {
        messages.push('El nombre debe tener como máximo 100 caracteres');
      } else {
        messages.push(`Nombre: ${error.fields.name}`);
      }
    }
    if (error.fields.muscleGroup) {
      messages.push('Seleccioná un grupo muscular válido');
    }
    if (error.fields.equipment) {
      messages.push('Seleccioná un equipamiento válido');
    }
    return messages.join('\n') || 'Datos inválidos';
  }

  if (error instanceof NetworkError) {
    return 'Error de red. Verificá tu conexión e intentá de nuevo.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado';
}

export function useExercises(): UseExercisesReturn {
  const { user } = useAuthContext();
  const uid = user?.uid ?? '';

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<MuscleGroup | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null);

  const fetchExercises = useCallback(async () => {
    if (!uid) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExercises.execute(uid);
      setExercises(data);
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    if (muscleGroupFilter) {
      result = result.filter((e) => e.muscleGroup === muscleGroupFilter);
    }

    if (equipmentFilter) {
      result = result.filter((e) => e.equipment === equipmentFilter);
    }

    return result;
  }, [exercises, searchQuery, muscleGroupFilter, equipmentFilter]);

  const checkDuplicateName = useCallback(
    (name: string, excludeId?: string): boolean => {
      const trimmed = name.trim().toLowerCase();
      return exercises.some(
        (e) =>
          e.name.trim().toLowerCase() === trimmed &&
          (!excludeId || e.id !== excludeId),
      );
    },
    [exercises],
  );

  const createExercise = useCallback(
    async (input: {
      name: string;
      muscleGroup: MuscleGroup;
      equipment: Equipment;
    }): Promise<Exercise | null> => {
      if (!uid) return null;
      if (checkDuplicateName(input.name)) {
        setError('Ya existe un ejercicio con ese nombre');
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const created = await createExerciseUseCase.execute(uid, input);
        setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      } catch (err) {
        setError(getSpanishErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid, checkDuplicateName],
  );

  const updateExercise = useCallback(
    async (
      exerciseId: string,
      input: Partial<{
        name: string;
        muscleGroup: MuscleGroup;
        equipment: Equipment;
      }>,
    ): Promise<Exercise | null> => {
      if (!uid) return null;
      if (input.name && checkDuplicateName(input.name, exerciseId)) {
        setError('Ya existe un ejercicio con ese nombre');
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const updated = await updateExerciseUseCase.execute(uid, exerciseId, input);
        setExercises((prev) =>
          prev
            .map((e) => (e.id === exerciseId ? updated : e))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        return updated;
      } catch (err) {
        setError(getSpanishErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid, checkDuplicateName],
  );

  const deleteExercise = useCallback(
    async (exerciseId: string): Promise<void> => {
      if (!uid) return;
      setIsLoading(true);
      setError(null);
      try {
        await deleteExerciseUseCase.execute(uid, exerciseId);
        setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
      } catch (err) {
        setError(getSpanishErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [uid],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exercises: filteredExercises,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    muscleGroupFilter,
    setMuscleGroupFilter,
    equipmentFilter,
    setEquipmentFilter,
    createExercise,
    updateExercise,
    deleteExercise,
    refresh: fetchExercises,
    clearError,
  };
}
