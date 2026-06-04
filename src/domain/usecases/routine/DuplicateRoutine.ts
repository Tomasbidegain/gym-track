import type { Routine } from '../../entities/Routine';
import { generateDuplicateName } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { RoutineNotFoundError } from '../../errors/RoutineError';

export class DuplicateRoutine {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(uid: string, routineId: string): Promise<Routine> {
    const original = await this.routineRepository.getById(uid, routineId);
    if (!original) {
      throw new RoutineNotFoundError(routineId);
    }

    const allRoutines = await this.routineRepository.getAll(uid);
    const existingNames = allRoutines.map((r) => r.name);
    const newName = generateDuplicateName(original.name, existingNames);

    return this.routineRepository.create(uid, {
      name: newName,
      description: original.description,
      days: original.days.map((day) => ({
        id: day.id,
        name: day.name,
        exercises: day.exercises.map((ex) => ({ ...ex })),
      })),
    });
  }
}
