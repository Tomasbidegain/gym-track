export type { UserProfile } from './entities/UserProfile';
export { isValidUserProfile } from './entities/UserProfile';

export type {
  Exercise,
  MuscleGroup,
  Equipment,
  ExerciseValidationResult,
} from './entities/Exercise';
export {
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  isValidMuscleGroup,
  isValidEquipment,
  validateExerciseInput,
} from './entities/Exercise';

export type {
  AuthCredentials,
  AuthState,
  AuthValidationResult,
} from './entities/AuthCredentials';
export { validateAuthCredentials } from './entities/AuthCredentials';

export type { IAuthRepository } from './repositories/IAuthRepository';
export type { IExerciseRepository } from './repositories/IExerciseRepository';
export type { IUserMetadataRepository } from './repositories/IUserMetadataRepository';
export type { IRoutineRepository } from './repositories/IRoutineRepository';

export type {
  Routine,
  RoutineExercise,
  RoutineValidationResult,
} from './entities/Routine';
export {
  validateRoutineInput,
  isOrphaned,
  generateDuplicateName,
} from './entities/Routine';

export {
  AuthError,
  InvalidCredentialsError,
  EmailInUseError,
  WeakPasswordError,
  UserNotFoundError,
  TooManyRequestsError,
  mapFirebaseAuthError,
} from './errors/AuthError';
export { ValidationError } from './errors/ValidationError';
export { NetworkError } from './errors/NetworkError';
export {
  RoutineNotFoundError,
  DuplicateRoutineNameError,
} from './errors/RoutineError';

export { RegisterUser } from './usecases/auth/RegisterUser';
export { LoginUser } from './usecases/auth/LoginUser';
export { LogoutUser } from './usecases/auth/LogoutUser';
export { GetCurrentUser } from './usecases/auth/GetCurrentUser';
export { UpdateProfile } from './usecases/auth/UpdateProfile';

export { GetExercises } from './usecases/exercise/GetExercises';
export { CreateExercise } from './usecases/exercise/CreateExercise';
export type { CreateExerciseInput } from './usecases/exercise/CreateExercise';
export { UpdateExercise } from './usecases/exercise/UpdateExercise';
export type { UpdateExerciseInput } from './usecases/exercise/UpdateExercise';
export { DeleteExercise } from './usecases/exercise/DeleteExercise';
export { SeedExercises } from './usecases/exercise/SeedExercises';

export { GetRoutines } from './usecases/routine/GetRoutines';
export { GetRoutineById } from './usecases/routine/GetRoutineById';
export { CreateRoutine } from './usecases/routine/CreateRoutine';
export type { CreateRoutineInput } from './usecases/routine/CreateRoutine';
export { UpdateRoutine } from './usecases/routine/UpdateRoutine';
export type { UpdateRoutineInput } from './usecases/routine/UpdateRoutine';
export { DeleteRoutine } from './usecases/routine/DeleteRoutine';
export { DuplicateRoutine } from './usecases/routine/DuplicateRoutine';
