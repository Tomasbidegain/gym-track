import type { RoutineExercise } from './Routine';

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  durationSeconds?: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  order: number;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  exercises: WorkoutExercise[];
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  totalVolume: number;
  totalDurationSeconds?: number;
  notes?: string;
}

export interface CreateWorkoutSessionInput {
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface UpdateWorkoutSetInput {
  exerciseIndex: number;
  setIndex: number;
  reps: number;
  weight: number;
  completed: boolean;
  durationSeconds?: number;
}

export function createWorkoutSession(
  id: string,
  input: CreateWorkoutSessionInput,
): WorkoutSession {
  return {
    id,
    ...input,
    startedAt: new Date(),
    isCompleted: false,
    totalVolume: calculateTotalVolume(input.exercises),
  };
}

export function calculateTotalVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((exerciseTotal, set) => {
      if (set.durationSeconds && set.durationSeconds > 0) {
        return exerciseTotal;
      }
      return exerciseTotal + (set.weight * set.reps);
    }, 0);
  }, 0);
}

export function updateWorkoutSet(
  session: WorkoutSession,
  input: UpdateWorkoutSetInput,
): WorkoutSession {
  const exercises = session.exercises.map((ex, idx) => {
    if (idx !== input.exerciseIndex) return ex;

    const sets = ex.sets.map((set, sIdx) => {
      if (sIdx !== input.setIndex) return set;
      const updated: WorkoutSet = {
        ...set,
        reps: input.reps,
        weight: input.weight,
        completed: input.completed,
      };
      if (input.durationSeconds !== undefined) {
        updated.durationSeconds = input.durationSeconds;
      }
      return updated;
    });

    return { ...ex, sets };
  });

  return {
    ...session,
    exercises,
    totalVolume: calculateTotalVolume(exercises),
  };
}

export function completeWorkoutSession(session: WorkoutSession): WorkoutSession {
  const completedAt = new Date();
  const totalDurationSeconds = session.startedAt
    ? Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000)
    : 0;

  return {
    ...session,
    completedAt,
    isCompleted: true,
    totalDurationSeconds,
  };
}

export function generateSetsFromRoutine(
  routineExercise: RoutineExercise,
): WorkoutSet[] {
  return Array.from({ length: routineExercise.targetSets }, (_, i) => ({
    setNumber: i + 1,
    reps: routineExercise.isTimeBased ? 0 : routineExercise.targetReps,
    weight: 0,
    completed: false,
    durationSeconds: 0,
  }));
}

export function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Adjust so Monday = 0, Sunday = 6
  const mondayBasedDay = day === 0 ? 6 : day - 1;

  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(date.getDate() - mondayBasedDay);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}
