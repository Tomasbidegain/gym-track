import type { WorkoutSession } from '../entities/WorkoutSession';

export interface IWorkoutSessionRepository {
  getAll(uid: string): Promise<WorkoutSession[]>;
  getById(uid: string, sessionId: string): Promise<WorkoutSession | null>;
  create(uid: string, session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession>;
  update(uid: string, sessionId: string, data: Partial<WorkoutSession>): Promise<WorkoutSession>;
  delete(uid: string, sessionId: string): Promise<void>;
  getByRoutineId(uid: string, routineId: string): Promise<WorkoutSession[]>;
  getByExerciseId(uid: string, exerciseId: string): Promise<WorkoutSession[]>;
  getCompletedDaysInWeek(
    uid: string,
    routineId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<string[]>;
}