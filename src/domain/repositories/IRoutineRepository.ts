import type { Routine } from '../entities/Routine';

export interface IRoutineRepository {
  /** Get all routines for a user. */
  getAll(uid: string): Promise<Routine[]>;

  /** Get a single routine by ID. */
  getById(uid: string, routineId: string): Promise<Routine | null>;

  /** Create a new routine. */
  create(
    uid: string,
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Routine>;

  /** Update an existing routine. */
  update(
    uid: string,
    routineId: string,
    data: Partial<Routine>,
  ): Promise<Routine>;

  /** Delete a routine. */
  delete(uid: string, routineId: string): Promise<void>;

  /** Duplicate an existing routine with a new name. */
  duplicate(uid: string, routineId: string): Promise<Routine>;
}
