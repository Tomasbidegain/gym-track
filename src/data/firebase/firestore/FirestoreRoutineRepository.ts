import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import type { Routine, RoutineExercise } from '../../../domain/entities/Routine';
import type { IRoutineRepository } from '../../../domain/repositories/IRoutineRepository';
import {
  RoutineNotFoundError,
} from '../../../domain/errors/RoutineError';
import { NetworkError } from '../../../domain/errors/NetworkError';
import { db } from '../firebaseConfig';
import { generateDuplicateName } from '../../../domain/entities/Routine';

interface FirestoreRoutineData {
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toRoutine(id: string, data: FirestoreRoutineData): Routine {
  return {
    id,
    name: data.name,
    description: data.description,
    exercises: data.exercises,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

function routinesPath(uid: string): string {
  return `users/${uid}/routines`;
}

export class FirestoreRoutineRepository implements IRoutineRepository {
  private readonly firestore: Firestore;

  constructor(firestore: Firestore = db) {
    this.firestore = firestore;
  }

  /** Get all routines for a user, ordered by name. */
  async getAll(uid: string): Promise<Routine[]> {
    try {
      const colRef = collection(this.firestore, routinesPath(uid));
      const q = query(colRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) =>
        toRoutine(docSnap.id, docSnap.data() as FirestoreRoutineData),
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Get a single routine by ID. */
  async getById(uid: string, routineId: string): Promise<Routine | null> {
    try {
      const docRef = doc(this.firestore, routinesPath(uid), routineId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return toRoutine(docSnap.id, docSnap.data() as FirestoreRoutineData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Create a new routine. */
  async create(
    uid: string,
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Routine> {
    try {
      const colRef = collection(this.firestore, routinesPath(uid));
      const now = serverTimestamp();
      const docRef = await addDoc(colRef, {
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
        createdAt: now,
        updatedAt: now,
      });
      return {
        id: docRef.id,
        name: routine.name,
        description: routine.description,
        exercises: routine.exercises,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Update an existing routine. */
  async update(
    uid: string,
    routineId: string,
    data: Partial<Routine>,
  ): Promise<Routine> {
    try {
      const docRef = doc(this.firestore, routinesPath(uid), routineId);
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      delete updateData.id;
      delete updateData.createdAt;
      await updateDoc(docRef, updateData as any);
      const updated = await this.getById(uid, routineId);
      if (!updated) {
        throw new Error('Routine not found after update');
      }
      return updated;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Delete a routine. */
  async delete(uid: string, routineId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, routinesPath(uid), routineId);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /** Duplicate an existing routine with a new name. */
  async duplicate(uid: string, routineId: string): Promise<Routine> {
    try {
      const original = await this.getById(uid, routineId);
      if (!original) {
        throw new RoutineNotFoundError(routineId);
      }

      const allRoutines = await this.getAll(uid);
      const existingNames = allRoutines.map((r) => r.name);
      const newName = generateDuplicateName(original.name, existingNames);

      return this.create(uid, {
        name: newName,
        description: original.description,
        exercises: original.exercises.map((ex) => ({ ...ex })),
      });
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
