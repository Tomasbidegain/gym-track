import { useCallback, useEffect, useState } from 'react';
import { GetCompletedDaysInWeek, getWeekBounds } from '../../domain';
import { FirestoreWorkoutSessionRepository } from '../../data';
import { useAuthContext } from '../context/AuthContext';

const repository = new FirestoreWorkoutSessionRepository();
const useCase = new GetCompletedDaysInWeek(repository);

export interface UseCompletedDaysInWeekReturn {
  completedDayIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCompletedDaysInWeek(routineId: string): UseCompletedDaysInWeekReturn {
  const { user } = useAuthContext();
  const uid = user?.uid ?? '';

  const [completedDayIds, setCompletedDayIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid || !routineId) {
      setCompletedDayIds(new Set());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { weekStart, weekEnd } = getWeekBounds(new Date());
      const dayIds = await useCase.execute(uid, routineId, weekStart, weekEnd);
      setCompletedDayIds(new Set(dayIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading completed days');
    } finally {
      setIsLoading(false);
    }
  }, [uid, routineId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { completedDayIds, isLoading, error, refresh };
}
