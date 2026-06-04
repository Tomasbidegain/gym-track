import type { Exercise } from '../../entities/Exercise';
import type { IExerciseRepository } from '../../repositories/IExerciseRepository';
import type { IUserMetadataRepository } from '../../repositories/IUserMetadataRepository';

export class SeedExercises {
  constructor(
    private readonly exerciseRepository: IExerciseRepository,
    private readonly metadataRepository: IUserMetadataRepository,
  ) {}

  /** Seed exercises for a user if not already seeded. */
  async execute(uid: string, exercises: Exercise[]): Promise<void> {
    const status = await this.metadataRepository.getSeedStatus(uid);
    if (status.seededAt !== null) {
      return;
    }
    await this.exerciseRepository.seed(uid, exercises);
    await this.metadataRepository.markAsSeeded(uid);
  }
}
