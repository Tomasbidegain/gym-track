export class RoutineNotFoundError extends Error {
  constructor(routineId: string) {
    super(`Routine not found: ${routineId}`);
    this.name = 'RoutineNotFoundError';
  }
}

export class DuplicateRoutineNameError extends Error {
  constructor(name: string) {
    super(`A routine with the name "${name}" already exists`);
    this.name = 'DuplicateRoutineNameError';
  }
}
