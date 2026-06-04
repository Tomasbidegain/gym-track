import type { IExerciseRepository } from '../../repositories/IExerciseRepository';

export class DeleteExercise {
  constructor(private readonly exerciseRepository: IExerciseRepository) {}

  /** Delete an exercise by ID. */
  async execute(uid: string, exerciseId: string): Promise<void> {
    return this.exerciseRepository.delete(uid, exerciseId);
  }
}
