import type { UserProfile } from '../entities/UserProfile';

export interface IAuthRepository {
  /** Register a new user with email and password. */
  register(email: string, password: string): Promise<UserProfile>;

  /** Log in an existing user with email and password. */
  login(email: string, password: string): Promise<UserProfile>;

  /** Sign out the current user. */
  logout(): Promise<void>;

  /** Return the currently authenticated user, or null. */
  getCurrentUser(): UserProfile | null;

  /** Subscribe to auth state changes. Returns an unsubscribe function. */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
}
