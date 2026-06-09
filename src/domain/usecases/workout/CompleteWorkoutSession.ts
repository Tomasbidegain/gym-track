import { completeWorkoutSession } from '../../entities/WorkoutSession';
import type { IWorkoutSessionRepository } from '../../repositories/IWorkoutSessionRepository';

export class CompleteWorkoutSession {
  constructor(private readonly repository: IWorkoutSessionRepository) {}

  async execute(uid: string, sessionId: string) {
    const session = await this.repository.getById(uid, sessionId);
    if (!session) {
      throw new Error('Workout session not found');
    }
    const completed = completeWorkoutSession(session);
    return this.repository.update(uid, sessionId, {
      isCompleted: completed.isCompleted,
      completedAt: completed.completedAt,
      totalDurationSeconds: completed.totalDurationSeconds,
    });
  }
}