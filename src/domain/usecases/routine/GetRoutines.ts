import type { Routine } from '../../entities/Routine';
import type { IRoutineRepository } from '../../repositories/IRoutineRepository';

export class GetRoutines {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  /** Get all routines for a user. */
  async execute(uid: string): Promise<Routine[]> {
    return this.routineRepository.getAll(uid);
  }
}
