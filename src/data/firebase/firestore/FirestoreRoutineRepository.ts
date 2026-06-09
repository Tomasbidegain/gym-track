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
  type FieldValue,
} from 'firebase/firestore';
import type { Routine, RoutineDay, RoutineExercise } from '../../../domain/entities/Routine';
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
  days?: RoutineDay[];
  exercises?: RoutineExercise[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function defaultRoutineExercise(ex: RoutineExercise): RoutineExercise {
  return {
    ...ex,
    isTimeBased: ex.isTimeBased ?? false,
    targetDurationSeconds: ex.targetDurationSeconds ?? 0,
  };
}

function cleanUndefinedValues(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanUndefinedValues(obj[key]);
    }
  }
  return cleaned;
}

function toRoutine(id: string, data: FirestoreRoutineData): Routine {
  let days: RoutineDay[];
  if (data.days && data.days.length > 0) {
    days = data.days.map((day) => ({
      ...day,
      exercises: day.exercises.map(defaultRoutineExercise),
    }));
  } else if (data.exercises && data.exercises.length > 0) {
    days = [
      {
        id: 'day-1',
        name: 'Dia 1',
        exercises: data.exercises.map(defaultRoutineExercise),
      },
    ];
  } else {
    days = [];
  }

  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;

  return {
    id,
    name: data.name,
    description: data.description,
    days,
    createdAt,
    updatedAt,
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

  async create(
    uid: string,
    routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Routine> {
    try {
      const colRef = collection(this.firestore, routinesPath(uid));
      const now = serverTimestamp();
      const docData: any = {
        name: routine.name,
        days: cleanUndefinedValues(routine.days),
        createdAt: now,
        updatedAt: now,
      };
      if (routine.description !== undefined) {
        docData.description = routine.description;
      }
      const docRef = await addDoc(colRef, docData);
      return {
        id: docRef.id,
        name: routine.name,
        description: routine.description,
        days: routine.days,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(
    uid: string,
    routineId: string,
    data: Partial<Routine>,
  ): Promise<Routine> {
    try {
      const docRef = doc(this.firestore, routinesPath(uid), routineId);
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.days !== undefined) updateData.days = cleanUndefinedValues(data.days);
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

  async delete(uid: string, routineId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, routinesPath(uid), routineId);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError(error);
    }
  }

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
        days: original.days.map((day) => ({
          id: day.id,
          name: day.name,
          exercises: day.exercises.map((ex) => ({ ...ex })),
        })),
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
