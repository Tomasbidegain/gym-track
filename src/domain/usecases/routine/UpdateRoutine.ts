import type { Routine, RoutineExercise } from '../../entities/Routine';
import { validateRoutineInput } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { ValidationError } from '../../errors/ValidationError';
import {
  RoutineNotFoundError,
  DuplicateRoutineNameError,
} from '../../errors/RoutineError';

export interface UpdateRoutineInput {
  name?: string;
  description?: string;
  exercises?: RoutineExercise[];
}

export class UpdateRoutine {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  /** Update an existing routine after validation. */
  async execute(
    uid: string,
    routineId: string,
    input: UpdateRoutineInput,
  ): Promise<Routine> {
    const existing = await this.routineRepository.getById(uid, routineId);
    if (!existing) {
      throw new RoutineNotFoundError(routineId);
    }

    const existingRoutines = await this.routineRepository.getAll(uid);
    const otherNames = existingRoutines
      .filter((r) => r.id !== routineId)
      .map((r) => r.name);

    if (input.name !== undefined) {
      const normalized = input.name.trim().toLowerCase();
      const hasDuplicate = otherNames.some(
        (n) => n.trim().toLowerCase() === normalized,
      );
      if (hasDuplicate) {
        throw new DuplicateRoutineNameError(input.name.trim());
      }
    }

    const dataToValidate = {
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      exercises: input.exercises ?? existing.exercises,
    };

    const result = validateRoutineInput(dataToValidate, otherNames);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }

    const data: Partial<Routine> = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.exercises !== undefined) {
      data.exercises = input.exercises.map((ex, index) => ({
        ...ex,
        order: ex.order ?? index,
      }));
    }

    return this.routineRepository.update(uid, routineId, data);
  }
}
