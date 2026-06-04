import type { Routine, RoutineDay } from '../../entities/Routine';
import { validateRoutineInput } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { ValidationError } from '../../errors/ValidationError';
import { DuplicateRoutineNameError } from '../../errors/RoutineError';

export interface CreateRoutineInput {
  name: string;
  description?: string;
  days: RoutineDay[];
}

export class CreateRoutine {
  constructor(private readonly routineRepository: IRoutineRepository) {}

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
      days: input.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex, index) => ({
          ...ex,
          order: ex.order ?? index,
        })),
      })),
    });
  }
}
