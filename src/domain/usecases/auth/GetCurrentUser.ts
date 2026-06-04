import type { UserProfile } from '../../entities/UserProfile';
import type { IAuthRepository } from '../../repositories/IAuthRepository';

export class GetCurrentUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  /** Return the currently authenticated user, or null. */
  execute(): UserProfile | null {
    return this.authRepository.getCurrentUser();
  }
}
