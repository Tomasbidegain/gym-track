import type { IWorkoutSessionRepository } from '../../repositories/IWorkoutSessionRepository';

export class GetCompletedDaysInWeek {
  constructor(private readonly repository: IWorkoutSessionRepository) {}

  async execute(uid: string, routineId: string, weekStart: Date, weekEnd: Date) {
    return this.repository.getCompletedDaysInWeek(uid, routineId, weekStart, weekEnd);
  }
}
