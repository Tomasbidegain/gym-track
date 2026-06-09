import type { IWorkoutSessionRepository } from '../../repositories/IWorkoutSessionRepository';

export class GetWorkoutSessions {
  constructor(private readonly repository: IWorkoutSessionRepository) {}

  async execute(uid: string) {
    return this.repository.getAll(uid);
  }
}