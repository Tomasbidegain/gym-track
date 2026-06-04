import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import type { Exercise, MuscleGroup, Equipment } from '../../../domain/entities/Exercise';
import type { IExerciseRepository } from '../../../domain/repositories/IExerciseRepository';
import { NetworkError } from '../../../domain/errors/NetworkError';
import { db } from '../firebaseConfig';

interface FirestoreExerciseData {
  name: string;
  muscleGroup: string;
  equipment: string;
  isCustom: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toExercise(id: string, data: FirestoreExerciseData): Exercise {
  return {
    id,
    name: data.name,
    muscleGroup: data.muscleGroup as MuscleGroup,
    equipment: data.equipment as Equipment,
    isCustom: data.isCustom,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function exercisesPath(uid: string): string {
  return `users/${uid}/exercises`;
}

export class FirestoreExerciseRepository implements IExerciseRepository {
  private readonly firestore: Firestore;

  constructor(firestore: Firestore = db) {
    this.firestore = firestore;
  }

  /** Get all exercises for a user, ordered by name. */
  async getAll(uid: string): Promise<Exercise[]> {
    try {
      const colRef = collection(this.firestore, exercisesPath(uid));
      const q = query(colRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) =>
        toExercise(docSnap.id, docSnap.data() as FirestoreExerciseData),
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Get a single exercise by ID. */
  async getById(uid: string, exerciseId: string): Promise<Exercise | null> {
    try {
      const docRef = doc(this.firestore, exercisesPath(uid), exerciseId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return toExercise(docSnap.id, docSnap.data() as FirestoreExerciseData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Create a new exercise. */
  async create(
    uid: string,
    exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Exercise> {
    try {
      const colRef = collection(this.firestore, exercisesPath(uid));
      const now = serverTimestamp();
      const docRef = await addDoc(colRef, {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        isCustom: exercise.isCustom,
        createdAt: now,
        updatedAt: now,
      });
      return {
        id: docRef.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        isCustom: exercise.isCustom,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Update an existing exercise. */
  async update(
    uid: string,
    exerciseId: string,
    data: Partial<Exercise>,
  ): Promise<Exercise> {
    try {
      const docRef = doc(this.firestore, exercisesPath(uid), exerciseId);
      const updateData: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
      delete updateData.id;
      delete updateData.createdAt;
      await updateDoc(docRef, updateData as any);
      const updated = await this.getById(uid, exerciseId);
      if (!updated) {
        throw new Error('Exercise not found after update');
      }
      return updated;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Delete an exercise. */
  async delete(uid: string, exerciseId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, exercisesPath(uid), exerciseId);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Bulk-insert seeded exercises using batched writes. */
  async seed(uid: string, exercises: Exercise[]): Promise<void> {
    try {
      const batchSize = 400;

      for (let i = 0; i < exercises.length; i += batchSize) {
        const batch = writeBatch(this.firestore);
        const chunk = exercises.slice(i, i + batchSize);
        for (const exercise of chunk) {
          const docRef = doc(
            this.firestore,
            exercisesPath(uid),
            exercise.id,
          );
          batch.set(docRef, {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            isCustom: exercise.isCustom,
            createdAt: exercise.createdAt,
            updatedAt: exercise.updatedAt,
          });
        }
        await batch.commit();
      }
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
