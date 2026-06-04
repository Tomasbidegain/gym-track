import type { Routine } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { RoutineNotFoundError } from '../../errors/RoutineError';

export class GetRoutineById {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  /** Get a single routine by ID. */
  async execute(uid: string, routineId: string): Promise<Routine> {
    const routine = await this.routineRepository.getById(uid, routineId);
    if (!routine) {
      throw new RoutineNotFoundError(routineId);
    }
    return routine;
  }
}
