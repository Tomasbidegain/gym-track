import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { WorkoutSession, CreateWorkoutSessionInput, UpdateWorkoutSetInput } from '../../domain';
import { CreateWorkoutSession, UpdateWorkoutSessionSet, CompleteWorkoutSession, GetWorkoutSessions } from '../../domain';
import { FirestoreWorkoutSessionRepository } from '../../data';
import { useAuthContext } from './AuthContext';

interface WorkoutSessionContextValue {
  sessions: WorkoutSession[];
  currentSession: WorkoutSession | null;
  isLoading: boolean;
  error: string | null;
  startSession: (input: CreateWorkoutSessionInput) => Promise<WorkoutSession | null>;
  updateSet: (sessionId: string, input: UpdateWorkoutSetInput) => Promise<WorkoutSession | null>;
  completeSession: (sessionId: string) => Promise<WorkoutSession | null>;
  setCurrentSession: (session: WorkoutSession | null) => void;
  clearCurrentSession: () => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | undefined>(undefined);

const workoutSessionRepository = new FirestoreWorkoutSessionRepository();
const createWorkoutSessionUseCase = new CreateWorkoutSession(workoutSessionRepository);
const updateWorkoutSessionSetUseCase = new UpdateWorkoutSessionSet(workoutSessionRepository);
const completeWorkoutSessionUseCase = new CompleteWorkoutSession(workoutSessionRepository);
const getWorkoutSessionsUseCase = new GetWorkoutSessions(workoutSessionRepository);

export function WorkoutSessionContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const uid = user?.uid ?? '';

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [currentSession, setCurrentSessionState] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!uid) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWorkoutSessionsUseCase.execute(uid);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sesiones');
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  // Load sessions automatically when user is authenticated
  useEffect(() => {
    if (uid) {
      fetchSessions();
    }
  }, [uid, fetchSessions]);

    const startSession = useCallback(
    async (input: CreateWorkoutSessionInput): Promise<WorkoutSession | null> => {
      if (!uid) {
        console.log('No hay uid');
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const created = await createWorkoutSessionUseCase.execute(uid, input);
        setSessions((prev) => [created, ...prev]);
        setCurrentSessionState(created);
        return created;
      } catch (err) {
        console.error('Error en startSession:', err);
        setError(err instanceof Error ? err.message : 'Error al crear sesion');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid],
  );

  const updateSet = useCallback(
    async (sessionId: string, input: UpdateWorkoutSetInput): Promise<WorkoutSession | null> => {
      if (!uid) return null;
      setIsLoading(true);
      setError(null);
      try {
        const updated = await updateWorkoutSessionSetUseCase.execute(uid, sessionId, input);
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
        if (currentSession?.id === sessionId) {
          setCurrentSessionState(updated);
        }
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar set');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid, currentSession],
  );

  const completeSession = useCallback(
    async (sessionId: string): Promise<WorkoutSession | null> => {
      if (!uid) return null;
      setIsLoading(true);
      setError(null);
      try {
        const completed = await completeWorkoutSessionUseCase.execute(uid, sessionId);
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? completed : s)));
        setCurrentSessionState(null);
        return completed;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al completar sesion');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [uid],
  );

  const setCurrentSession = useCallback((session: WorkoutSession | null) => {
    setCurrentSessionState(session);
  }, []);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionState(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      currentSession,
      isLoading,
      error,
      startSession,
      updateSet,
      completeSession,
      setCurrentSession,
      clearCurrentSession,
      refresh: fetchSessions,
      clearError,
    }),
    [
      sessions,
      currentSession,
      isLoading,
      error,
      startSession,
      updateSet,
      completeSession,
      setCurrentSession,
      clearCurrentSession,
      fetchSessions,
      clearError,
    ],
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSessionContext(): WorkoutSessionContextValue {
  const context = useContext(WorkoutSessionContext);
  if (!context) {
    throw new Error('useWorkoutSessionContext must be used within a WorkoutSessionContextProvider');
  }
  return context;
}
