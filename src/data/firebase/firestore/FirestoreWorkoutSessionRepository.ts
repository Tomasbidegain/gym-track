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
  where,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import type { WorkoutSession } from '../../../domain/entities/WorkoutSession';
import type { IWorkoutSessionRepository } from '../../../domain/repositories/IWorkoutSessionRepository';
import { db } from '../firebaseConfig';

interface FirestoreWorkoutSessionData {
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  exercises: WorkoutSession['exercises'];
  startedAt: Timestamp;
  completedAt?: Timestamp;
  isCompleted: boolean;
  totalVolume: number;
  notes?: string;
}

function sessionsPath(uid: string): string {
  return `users/${uid}/workoutSessions`;
}

function toWorkoutSession(id: string, data: FirestoreWorkoutSessionData): WorkoutSession {
  return {
    id,
    routineId: data.routineId,
    routineName: data.routineName,
    dayId: data.dayId,
    dayName: data.dayName,
    exercises: data.exercises,
    startedAt: data.startedAt.toDate(),
    completedAt: data.completedAt?.toDate(),
    isCompleted: data.isCompleted,
    totalVolume: data.totalVolume,
    notes: data.notes,
  };
}

export class FirestoreWorkoutSessionRepository implements IWorkoutSessionRepository {
  private readonly firestore: Firestore;

  constructor(firestore: Firestore = db) {
    this.firestore = firestore;
  }

  async getAll(uid: string): Promise<WorkoutSession[]> {
    const colRef = collection(this.firestore, sessionsPath(uid));
    const q = query(colRef, orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      toWorkoutSession(docSnap.id, docSnap.data() as FirestoreWorkoutSessionData),
    );
  }

  async getById(uid: string, sessionId: string): Promise<WorkoutSession | null> {
    const docRef = doc(this.firestore, sessionsPath(uid), sessionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return toWorkoutSession(docSnap.id, docSnap.data() as FirestoreWorkoutSessionData);
  }

  async create(
    uid: string,
    session: Omit<WorkoutSession, 'id'>,
  ): Promise<WorkoutSession> {
    const colRef = collection(this.firestore, sessionsPath(uid));
    const data: any = {
      routineId: session.routineId,
      routineName: session.routineName,
      dayId: session.dayId,
      dayName: session.dayName,
      exercises: session.exercises,
      startedAt: serverTimestamp(),
      isCompleted: session.isCompleted,
      totalVolume: session.totalVolume,
    };
    if (session.notes !== undefined) {
      data.notes = session.notes;
    }
    const docRef = await addDoc(colRef, data);
    return {
      ...session,
      id: docRef.id,
    };
  }

  async update(
    uid: string,
    sessionId: string,
    data: Partial<WorkoutSession>,
  ): Promise<WorkoutSession> {
    const docRef = doc(this.firestore, sessionsPath(uid), sessionId);
    const updateData: any = {};
    if (data.exercises !== undefined) updateData.exercises = data.exercises;
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
    if (data.totalVolume !== undefined) updateData.totalVolume = data.totalVolume;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    if (data.notes !== undefined) updateData.notes = data.notes;
    await updateDoc(docRef, updateData);
    const updated = await this.getById(uid, sessionId);
    if (!updated) {
      throw new Error('Workout session not found after update');
    }
    return updated;
  }

  async delete(uid: string, sessionId: string): Promise<void> {
    const docRef = doc(this.firestore, sessionsPath(uid), sessionId);
    await deleteDoc(docRef);
  }

  async getByRoutineId(uid: string, routineId: string): Promise<WorkoutSession[]> {
    const colRef = collection(this.firestore, sessionsPath(uid));
    const q = query(colRef, where('routineId', '==', routineId), orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      toWorkoutSession(docSnap.id, docSnap.data() as FirestoreWorkoutSessionData),
    );
  }

  async getByExerciseId(uid: string, exerciseId: string): Promise<WorkoutSession[]> {
    const colRef = collection(this.firestore, sessionsPath(uid));
    const snapshot = await getDocs(colRef);
    const sessions = snapshot.docs.map((docSnap) =>
      toWorkoutSession(docSnap.id, docSnap.data() as FirestoreWorkoutSessionData),
    );
    return sessions.filter((session) =>
      session.exercises.some((ex) => ex.exerciseId === exerciseId),
    );
  }

  async getCompletedDaysInWeek(
    uid: string,
    routineId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<string[]> {
    const colRef = collection(this.firestore, sessionsPath(uid));

    // Firestore Timestamp is required for inequality comparisons
    const { Timestamp } = await import('firebase/firestore');

    try {
      const q = query(
        colRef,
        where('routineId', '==', routineId),
        where('isCompleted', '==', true),
        where('completedAt', '>=', Timestamp.fromDate(weekStart)),
        where('completedAt', '<=', Timestamp.fromDate(weekEnd)),
      );
      const snapshot = await getDocs(q);
      const dayIds = snapshot.docs.map(
        (docSnap) => (docSnap.data() as FirestoreWorkoutSessionData).dayId,
      );
      // Deduplicate in case the same day was completed multiple times
      return [...new Set(dayIds)];
    } catch (error) {
      // Fallback: if composite index is missing, fetch by routine and filter client-side
      const q = query(colRef, where('routineId', '==', routineId), where('isCompleted', '==', true));
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map((docSnap) =>
        toWorkoutSession(docSnap.id, docSnap.data() as FirestoreWorkoutSessionData),
      );
      const dayIds = sessions
        .filter(
          (session) =>
            session.completedAt !== undefined &&
            session.completedAt >= weekStart &&
            session.completedAt <= weekEnd,
        )
        .map((session) => session.dayId);
      return [...new Set(dayIds)];
    }
  }
}