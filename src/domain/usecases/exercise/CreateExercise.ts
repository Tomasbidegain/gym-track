import type { Exercise, MuscleGroup, Equipment } from '../../entities/Exercise';
import { validateExerciseInput } from '../../entities/Exercise';
import type { IExerciseRepository } from '../../repositories/IExerciseRepository';
import { ValidationError } from '../../errors/ValidationError';

export interface CreateExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
}

export class CreateExercise {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  /** Create a new custom exercise after validation. */
  async execute(uid: string, input: CreateExerciseInput): Promise<Exercise> {
    const result = validateExerciseInput(input);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }
    return this.exerciseRepository.create(uid, {
      name: input.name.trim(),
      muscleGroup: input.muscleGroup,
      equipment: input.equipment,
      isCustom: true,
    });
  }
}
