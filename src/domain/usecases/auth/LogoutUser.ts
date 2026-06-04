import type { IAuthRepository } from '../../repositories/IAuthRepository';

export class LogoutUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  /** Sign out the current user. */
  async execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
