import type { MuscleGroup, Equipment } from './Exercise';

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  order: number;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRoutineInput(
  data: {
    name?: string;
    description?: string;
    exercises?: RoutineExercise[];
  },
  existingNames?: string[],
): RoutineValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Routine name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Routine name must be at most 100 characters';
  } else if (existingNames && existingNames.length > 0) {
    const normalized = data.name.trim().toLowerCase();
    const hasDuplicate = existingNames.some(
      (n) => n.trim().toLowerCase() === normalized,
    );
    if (hasDuplicate) {
      errors.name = 'A routine with this name already exists';
    }
  }

  if (!data.exercises || data.exercises.length === 0) {
    errors.exercises = 'At least one exercise is required';
  } else {
    data.exercises.forEach((ex, index) => {
      if (!ex.exerciseId || ex.exerciseId.trim().length === 0) {
        errors[`exercises[${index}].exerciseId`] = 'Exercise ID is required';
      }
      if (!ex.exerciseName || ex.exerciseName.trim().length === 0) {
        errors[`exercises[${index}].exerciseName`] = 'Exercise name is required';
      }
      if (ex.order < 0) {
        errors[`exercises[${index}].order`] = 'Order must be non-negative';
      }
      if (ex.targetSets <= 0) {
        errors[`exercises[${index}].targetSets`] =
          'Target sets must be greater than 0';
      }
      if (ex.targetReps <= 0) {
        errors[`exercises[${index}].targetReps`] =
          'Target reps must be greater than 0';
      }
      if (ex.restSeconds < 0) {
        errors[`exercises[${index}].restSeconds`] =
          'Rest seconds must be non-negative';
      }
    });
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function isOrphaned(
  routineExercise: RoutineExercise,
  validExerciseIds: string[],
): boolean {
  return !validExerciseIds.includes(routineExercise.exerciseId);
}

export function generateDuplicateName(
  originalName: string,
  existingNames: string[],
): string {
  const base = originalName.trim();
  let candidate = `${base} (Copy)`;
  let counter = 2;

  const normalizedExisting = existingNames.map((n) => n.trim().toLowerCase());

  while (normalizedExisting.includes(candidate.toLowerCase())) {
    candidate = `${base} (Copy ${counter})`;
    counter++;
  }

  return candidate;
}
