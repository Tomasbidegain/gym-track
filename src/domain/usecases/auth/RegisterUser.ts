import type { UserProfile } from '../../entities/UserProfile';
import type { AuthCredentials } from '../../entities/AuthCredentials';
import { validateAuthCredentials } from '../../entities/AuthCredentials';
import type { IAuthRepository } from '../../repositories/IAuthRepository';
import { ValidationError } from '../../errors/ValidationError';

export class RegisterUser {
  constructor(private readonly authRepository: IAuthRepository) {}

  /** Register a new user after validating credentials. */
  async execute(credentials: AuthCredentials): Promise<UserProfile> {
    const result = validateAuthCredentials(credentials);
    if (!result.valid) {
      throw new ValidationError(result.errors);
    }
    return this.authRepository.register(credentials.email, credentials.password);
  }
}
