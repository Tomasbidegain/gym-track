import type { Exercise } from '../../entities/Exercise';
import type { IExerciseRepository } from '../../repositories/IExerciseRepository';

export class GetExercises {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  /** Get all exercises for a user. */
  async execute(uid: string): Promise<Exercise[]> {
    return this.exerciseRepository.getAll(uid);
  }
}
