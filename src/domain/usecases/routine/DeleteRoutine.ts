import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { RoutineNotFoundError } from '../../errors/RoutineError';

export class DeleteRoutine {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  /** Delete a routine by ID. */
  async execute(uid: string, routineId: string): Promise<void> {
    const existing = await this.routineRepository.getById(uid, routineId);
    if (!existing) {
      throw new RoutineNotFoundError(routineId);
    }
    return this.routineRepository.delete(uid, routineId);
  }
}
