import type { UserProfile } from './UserProfile';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateAuthCredentials(
  credentials: AuthCredentials,
): AuthValidationResult {
  const errors: Record<string, string> = {};

  if (!credentials.email || credentials.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.email = 'Invalid email format';
  }

  if (!credentials.password || credentials.password.length === 0) {
    errors.password = 'Password is required';
  } else if (credentials.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
