import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Routine, CreateRoutineInput, UpdateRoutineInput } from '../../domain';
import {
  GetRoutines,
  GetRoutineById,
  CreateRoutine,
  UpdateRoutine,
  DeleteRoutine,
  DuplicateRoutine,
  ValidationError,
  NetworkError,
  RoutineNotFoundError,
  DuplicateRoutineNameError,
} from '../../domain';
import { FirestoreRoutineRepository } from '../../data';
import { useAuthContext } from './AuthContext';

interface RoutineContextValue {
  routines: Routine[];
  isLoading: boolean;
  error: string | null;
  currentRoutine: Routine | null;
  refresh: () => Promise<void>;
  setCurrentRoutine: (routine: Routine | null) => void;
  clearCurrentRoutine: () => void;
  createRoutine: (input: CreateRoutineInput) => Promise<Routine | null>;
  updateRoutine: (routineId: string, input: UpdateRoutineInput) => Promise<Routine | null>;
  deleteRoutine: (routineId: string) => Promise<void>;
  duplicateRoutine: (routineId: string) => Promise<Routine | null>;
  clearError: () => void;
}

const RoutineContext = createContext<RoutineContextValue | undefined>(undefined);

const routineRepository = new FirestoreRoutineRepository();
const getRoutines = new GetRoutines(routineRepository);
const getRoutineById = new GetRoutineById(routineRepository);
const createRoutineUseCase = new CreateRoutine(routineRepository);
const updateRoutineUseCase = new UpdateRoutine(routineRepository);
const deleteRoutineUseCase = new DeleteRoutine(routineRepository);
const duplicateRoutineUseCase = new DuplicateRoutine(routineRepository);

function getSpanishErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const messages: string[] = [];
    if (error.fields.name) {
      if (error.fields.name.includes('required')) {
        messages.push('El nombre es obligatorio');
      } else if (error.fields.name.includes('at most 100')) {
        messages.push('El nombre debe tener como máximo 100 caracteres');
      } else if (error.fields.name.includes('already exists')) {
        messages.push('Ya existe una rutina con ese nombre');
      } else {
        messages.push(`Nombre: ${error.fields.name}`);
      }
    }
    if (error.fields.exercises) {
      if (error.fields.exercises.includes('required')) {
        messages.push('Agregá al menos un ejercicio');
      } else {
        messages.push(`Ejercicios: ${error.fields.exercises}`);
      }
    }
    // Handle per-exercise validation fields
    Object.entries(error.fields).forEach(([field, msg]) => {
      if (field.startsWith('exercises[')) {
        if (msg.includes('required')) {
          const index = field.match(/\[(\d+)\]/)?.[1];
          messages.push(`Ejercicio ${index ? Number(index) + 1 : ''}: campo obligatorio`);
        } else {
          messages.push(`${field}: ${msg}`);
        }
      }
    });
    return messages.join('\n') || 'Datos inválidos';
  }

  if (error instanceof DuplicateRoutineNameError) {
    return 'Ya existe una rutina con ese nombre';
  }

  if (error instanceof RoutineNotFoundError) {
    return 'No se encontró la rutina';
  }

  if (error instanceof NetworkError) {
    return 'Error de red. Verificá tu conexión e intentá de nuevo.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado';
}

export function RoutineContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const uid = user?.uid ?? '';

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoutine, setCurrentRoutineState] = useState<Routine | null>(null);

  const fetchRoutines = useCallback(async () => {
    if (!uid) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRoutines.execute(uid);
      setRoutines(data);
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const setCurrentRoutine = useCallback((routine: Routine | null) => {
    setCurrentRoutineState(routine);
  }, []);

  const clearCurrentRoutine = useCallback(() => {
    setCurrentRoutineState(null);
  }, []);

  const createRoutine = useCallback(
    async (input: CreateRoutineInput): Promise<Routine | null> => {
      if (!uid) return null;
      setIsLoading(true);
      setError(null);
      try {
        const created = await createRoutineUseCase.execute(uid, input);
        setRoutines((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        return created;
      } catch (err) {
        setError(getSpanishErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid],
  );

  const updateRoutine = useCallback(
    async (routineId: string, input: UpdateRoutineInput): Promise<Routine | null> => {
      if (!uid) return null;
      setIsLoading(true);
      setError(null);
      try {
        const updated = await updateRoutineUseCase.execute(uid, routineId, input);
        setRoutines((prev) =>
          prev
            .map((r) => (r.id === routineId ? updated : r))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        if (currentRoutine?.id === routineId) {
          setCurrentRoutineState(updated);
        }
        return updated;
      } catch (err) {
        setError(getSpanishErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid, currentRoutine],
  );

  const deleteRoutine = useCallback(
    async (routineId: string): Promise<void> => {
      if (!uid) return;
      setIsLoading(true);
      setError(null);
      try {
        await deleteRoutineUseCase.execute(uid, routineId);
        setRoutines((prev) => prev.filter((r) => r.id !== routineId));
        if (currentRoutine?.id === routineId) {
          setCurrentRoutineState(null);
        }
      } catch (err) {
        setError(getSpanishErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    },
    [uid, currentRoutine],
  );

  const duplicateRoutine = useCallback(
    async (routineId: string): Promise<Routine | null> => {
      if (!uid) return null;
      setIsLoading(true);
      setError(null);
      try {
        const duplicated = await duplicateRoutineUseCase.execute(uid, routineId);
        setRoutines((prev) =>
          [...prev, duplicated].sort((a, b) => a.name.localeCompare(b.name)),
        );
        return duplicated;
      } catch (err) {
        setError(getSpanishErrorMessage(err));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      routines,
      isLoading,
      error,
      currentRoutine,
      refresh: fetchRoutines,
      setCurrentRoutine,
      clearCurrentRoutine,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      duplicateRoutine,
      clearError,
    }),
    [
      routines,
      isLoading,
      error,
      currentRoutine,
      fetchRoutines,
      setCurrentRoutine,
      clearCurrentRoutine,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      duplicateRoutine,
      clearError,
    ],
  );

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutineContext(): RoutineContextValue {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutineContext must be used within a RoutineContextProvider');
  }
  return context;
}
