import type { Exercise } from '../entities/Exercise';

export interface IExerciseRepository {
  /** Get all exercises for a user. */
  getAll(uid: string): Promise<Exercise[]>;

  /** Get a single exercise by ID. */
  getById(uid: string, exerciseId: string): Promise<Exercise | null>;

  /** Create a new exercise. */
  create(
    uid: string,
    exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Exercise>;

  /** Update an existing exercise. */
  update(
    uid: string,
    exerciseId: string,
    data: Partial<Exercise>,
  ): Promise<Exercise>;

  /** Delete an exercise. */
  delete(uid: string, exerciseId: string): Promise<void>;

  /** Bulk-insert seeded exercises. */
  seed(uid: string, exercises: Exercise[]): Promise<void>;
}
