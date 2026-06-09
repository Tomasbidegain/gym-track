import type { WorkoutSession, CreateWorkoutSessionInput } from '../../entities/WorkoutSession';
import { createWorkoutSession } from '../../entities/WorkoutSession';
import type { IWorkoutSessionRepository } from '../../repositories/IWorkoutSessionRepository';

export class CreateWorkoutSession {
  constructor(private readonly repository: IWorkoutSessionRepository) {}

  async execute(uid: string, input: CreateWorkoutSessionInput): Promise<WorkoutSession> {
    const session = createWorkoutSession('temp', input);
    return this.repository.create(uid, session);
  }
}