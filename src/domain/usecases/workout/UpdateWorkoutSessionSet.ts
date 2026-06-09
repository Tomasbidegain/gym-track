import type { WorkoutSession, UpdateWorkoutSetInput } from '../../entities/WorkoutSession';
import { updateWorkoutSet } from '../../entities/WorkoutSession';
import type { IWorkoutSessionRepository } from '../../repositories/IWorkoutSessionRepository';

export class UpdateWorkoutSessionSet {
  constructor(private readonly repository: IWorkoutSessionRepository) {}

  async execute(
    uid: string,
    sessionId: string,
    input: UpdateWorkoutSetInput,
  ): Promise<WorkoutSession> {
    const session = await this.repository.getById(uid, sessionId);
    if (!session) {
      throw new Error('Workout session not found');
    }
    const updated = updateWorkoutSet(session, input);
    return this.repository.update(uid, sessionId, {
      exercises: updated.exercises,
      totalVolume: updated.totalVolume,
    });
  }
}