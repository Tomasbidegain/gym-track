import type { Exercise, MuscleGroup, Equipment } from '../../entities/Exercise';
import { isValidMuscleGroup, isValidEquipment } from '../../entities/Exercise';
import type { IExerciseRepository } from '../../repositories/IExerciseRepository';
import { ValidationError } from '../../errors/ValidationError';

export interface UpdateExerciseInput {
  name?: string;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
}

export class UpdateExercise {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  /** Update an existing exercise after validating only provided fields. */
  async execute(
    uid: string,
    exerciseId: string,
    input: UpdateExerciseInput,
  ): Promise<Exercise> {
    const errors: Record<string, string> = {};

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (trimmed.length === 0) {
        errors.name = 'Exercise name cannot be empty';
      } else if (trimmed.length < 2) {
        errors.name = 'Exercise name must be at least 2 characters';
      } else if (trimmed.length > 100) {
        errors.name = 'Exercise name must be at most 100 characters';
      }
    }

    if (input.muscleGroup !== undefined) {
      if (!isValidMuscleGroup(input.muscleGroup)) {
        errors.muscleGroup = `Invalid muscle group: ${input.muscleGroup}`;
      }
    }

    if (input.equipment !== undefined) {
      if (!isValidEquipment(input.equipment)) {
        errors.equipment = `Invalid equipment: ${input.equipment}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    const data: Partial<Exercise> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.muscleGroup !== undefined) data.muscleGroup = input.muscleGroup;
    if (input.equipment !== undefined) data.equipment = input.equipment;

    return this.exerciseRepository.update(uid, exerciseId, data);
  }
}
