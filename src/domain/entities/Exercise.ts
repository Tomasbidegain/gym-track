export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'forearms',
  'glutes',
  'calves',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const;

export type Equipment = (typeof EQUIPMENT_TYPES)[number];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function isValidMuscleGroup(value: string): value is MuscleGroup {
  return (MUSCLE_GROUPS as readonly string[]).includes(value);
}

export function isValidEquipment(value: string): value is Equipment {
  return (EQUIPMENT_TYPES as readonly string[]).includes(value);
}

export interface ExerciseValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateExerciseInput(data: {
  name?: string;
  muscleGroup?: string;
  equipment?: string;
}): ExerciseValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Exercise name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Exercise name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Exercise name must be at most 100 characters';
  }

  if (!data.muscleGroup) {
    errors.muscleGroup = 'Muscle group is required';
  } else if (!isValidMuscleGroup(data.muscleGroup)) {
    errors.muscleGroup = `Invalid muscle group: ${data.muscleGroup}`;
  }

  if (!data.equipment) {
    errors.equipment = 'Equipment is required';
  } else if (!isValidEquipment(data.equipment)) {
    errors.equipment = `Invalid equipment: ${data.equipment}`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
