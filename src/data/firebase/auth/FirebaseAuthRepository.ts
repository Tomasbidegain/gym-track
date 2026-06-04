import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from 'firebase/auth';
import type { UserProfile } from '../../../domain/entities/UserProfile';
import type { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { mapFirebaseAuthError } from '../../../domain/errors/AuthError';
import { NetworkError } from '../../../domain/errors/NetworkError';
import { auth } from '../firebaseConfig';

function toUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? undefined,
    createdAt: new Date(user.metadata.creationTime ?? Date.now()),
  };
}

export class FirebaseAuthRepository implements IAuthRepository {
  /** Register a new user with email and password. */
  async register(email: string, password: string): Promise<UserProfile> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return toUserProfile(credential.user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Log in an existing user with email and password. */
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return toUserProfile(credential.user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Sign out the current user. */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Return the currently authenticated user, or null. */
  getCurrentUser(): UserProfile | null {
    const user = auth.currentUser;
    return user ? toUserProfile(user) : null;
  }

  /** Subscribe to auth state changes. Returns an unsubscribe function. */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user ? toUserProfile(user) : null);
    });
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/network-request-failed') {
        return new NetworkError();
      }
      return mapFirebaseAuthError(code);
    }
    return new Error('An unexpected authentication error occurred');
  }
}
