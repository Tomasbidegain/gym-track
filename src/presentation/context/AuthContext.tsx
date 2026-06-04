import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UserProfile } from '../../domain';
import {
  RegisterUser,
  LoginUser,
  LogoutUser,
  GetCurrentUser,
  UpdateProfile,
  SeedExercises,
  ValidationError,
  AuthError,
  NetworkError,
  mapFirebaseAuthError,
} from '../../domain';
import {
  FirebaseAuthRepository,
  FirestoreUserMetadataRepository,
  FirestoreExerciseRepository,
} from '../../data';
import seedExercisesJson from '../../data/local/seed/exercises.json';
import type { Exercise, MuscleGroup, Equipment } from '../../domain';

interface AuthContextValue {
  user: UserProfile | null;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authRepository = new FirebaseAuthRepository();
const metadataRepository = new FirestoreUserMetadataRepository();
const exerciseRepository = new FirestoreExerciseRepository();

const registerUser = new RegisterUser(authRepository);
const loginUser = new LoginUser(authRepository);
const logoutUser = new LogoutUser(authRepository);
const getCurrentUser = new GetCurrentUser(authRepository);
const updateProfile = new UpdateProfile(metadataRepository);
const seedExercises = new SeedExercises(exerciseRepository, metadataRepository);

function toSeedExercises(data: Array<{ name: string; muscleGroup: string; equipment: string }>): Exercise[] {
  return data.map((item, index) => ({
    id: `seed-${index}`,
    name: item.name,
    muscleGroup: item.muscleGroup as MuscleGroup,
    equipment: item.equipment as Equipment,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

const seededExercises = toSeedExercises(seedExercisesJson);

function getSpanishErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const messages: string[] = [];
    if (error.fields.email) {
      if (error.fields.email.includes('required')) {
        messages.push('El email es obligatorio');
      } else if (error.fields.email.includes('format')) {
        messages.push('El formato del email no es válido');
      } else {
        messages.push(`Email: ${error.fields.email}`);
      }
    }
    if (error.fields.password) {
      if (error.fields.password.includes('required')) {
        messages.push('La contraseña es obligatoria');
      } else if (error.fields.password.includes('at least 6')) {
        messages.push('La contraseña debe tener al menos 6 caracteres');
      } else {
        messages.push(`Contraseña: ${error.fields.password}`);
      }
    }
    return messages.join('\n') || 'Datos inválidos';
  }

  if (error instanceof AuthError) {
    switch (error.code) {
      case 'auth/invalid-credentials':
      case 'auth/wrong-password':
      case 'auth/user-disabled':
        return 'Email o contraseña incorrectos';
      case 'auth/email-in-use':
        return 'El email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña es muy débil (mínimo 6 caracteres)';
      case 'auth/user-not-found':
        return 'No se encontró un usuario con este email';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Por favor, intentalo más tarde';
      default:
        return 'Ocurrió un error de autenticación';
    }
  }

  if (error instanceof NetworkError) {
    return 'Error de red. Verificá tu conexión e intentá de nuevo.';
  }

  if (error instanceof Error) {
    if (error.message.includes('empty')) {
      return 'El nombre no puede estar vacío';
    }
    if (error.message.includes('at most 50')) {
      return 'El nombre debe tener como máximo 50 caracteres';
    }
    return error.message;
  }

  return 'Ocurrió un error inesperado';
}

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser.execute());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seededUids = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = authRepository.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsInitializing(false);

      if (firebaseUser && !seededUids.current.has(firebaseUser.uid)) {
        seededUids.current.add(firebaseUser.uid);
        seedExercises.execute(firebaseUser.uid, seededExercises).catch(() => {
          // Seeding is best-effort; do not block the user
        });
      }
    });

    return unsubscribe;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerUser.execute({ email, password });
      // onAuthStateChanged will update user state
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginUser.execute({ email, password });
      // onAuthStateChanged will update user state
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutUser.execute();
      seededUids.current.clear();
      // onAuthStateChanged will update user state to null
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      await updateProfile.execute(user.uid, name);
      setUser((prev) => (prev ? { ...prev, displayName: name.trim() } : null));
    } catch (err) {
      setError(getSpanishErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isLoading,
      error,
      register,
      login,
      logout,
      updateDisplayName,
      clearError,
    }),
    [user, isInitializing, isLoading, error, register, login, logout, updateDisplayName, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthContextProvider');
  }
  return context;
}
