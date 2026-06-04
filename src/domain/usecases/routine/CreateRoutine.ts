import type { Routine, RoutineExercise } from '../../entities/Routine';
import { validateRoutineInput } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { ValidationError } from '../../errors/ValidationError';
import { DuplicateRoutineNameError } from '../../errors/RoutineError';

export interface CreateRoutineInput {
  name: string;
  description?: string;
  exercises: RoutineExercise[];
}

export class CreateRoutine {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  /** Create a new routine after validation and duplicate name check. */
  async execute(uid: string, input: CreateRoutineInput): Promise<Routine> {
    const existingRoutines = await this.routineRepository.getAll(uid);
    const existingNames = existingRoutines.map((r) => r.name);

    const normalized = input.name.trim().toLowerCase();
    const hasDuplicate = existingNames.some(
      (n) => n.trim().toLowerCase() === normalized,
    );
    if (hasDuplicate) {
      throw new DuplicateRoutineNameError(input.name.trim());
    }

    const result = validateRoutineInput(input, existingNames);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }

    return this.routineRepository.create(uid, {
      name: input.name.trim(),
      description: input.description?.trim(),
      exercises: input.exercises.map((ex, index) => ({
        ...ex,
        order: ex.order ?? index,
      })),
    });
  }
}
