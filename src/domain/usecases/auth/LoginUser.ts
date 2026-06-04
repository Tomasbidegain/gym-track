import type { UserProfile } from '../../entities/UserProfile';
import type { AuthCredentials } from '../../entities/AuthCredentials';
import { validateAuthCredentials } from '../../entities/AuthCredentials';
import type { IAuthRepository } from '../../repositories/IAuthRepository';
import { ValidationError } from '../../errors/ValidationError';

export class LoginUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  /** Log in a user after validating credentials. */
  async execute(credentials: AuthCredentials): Promise<UserProfile> {
    const result = validateAuthCredentials(credentials);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }
    return this.authRepository.login(credentials.email, credentials.password);
  }
}
