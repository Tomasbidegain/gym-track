import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import type { IUserMetadataRepository } from '../../../domain/repositories/IUserMetadataRepository';
import { NetworkError } from '../../../domain/errors/NetworkError';
import { db } from '../firebaseConfig';

function metadataPath(uid: string): string {
  return `users/${uid}/metadata/userMetadata`;
}

export class FirestoreUserMetadataRepository implements IUserMetadataRepository {
  private readonly firestore: Firestore;

  constructor(firestore: Firestore = db) {
    this.firestore = firestore;
  }

  /** Get the seed status for a user. */
  async getSeedStatus(uid: string): Promise<{ seededAt: Date | null }> {
    try {
      const docRef = doc(this.firestore, metadataPath(uid));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { seededAt: null };
      }
      const data = docSnap.data();
      const seededAt = data?.seededAt as Timestamp | undefined;
      return { seededAt: seededAt ? seededAt.toDate() : null };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Mark the user's exercise collection as seeded. */
  async markAsSeeded(uid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, metadataPath(uid));
      await setDoc(
        docRef,
        { seededAt: new Date() },
        { merge: true },
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Update the user's display name. */
  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, metadataPath(uid));
      await updateDoc(docRef, { displayName });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (
      error instanceof Error &&
      error.message.includes('Failed to fetch')
    ) {
      return new NetworkError();
    }
    if (error instanceof Error) return error;
    return new Error('An unexpected error occurred');
  }
}
