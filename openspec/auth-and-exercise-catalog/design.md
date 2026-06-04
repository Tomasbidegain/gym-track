# Design: Auth + Exercise Catalog

## Technical Approach

Implement Clean Architecture with three inward-pointing layers: domain (pure TypeScript), data (Firebase implementations), and presentation (React Native + hooks). Firebase Auth manages sessions; Firestore stores per-user exercises under `users/{uid}/exercises`. First-login seeding loads ~80 exercises from a JSON asset via a batched write.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|----------|---------|-----------|--------|
| State management | Context + hooks vs Redux/Zustand | Context is simpler, sufficient for MVP; Redux adds boilerplate | Context + hooks |
| Auth persistence | Firebase `onAuthStateChanged` vs custom token storage | Firebase handles caching and offline resilience automatically | Firebase `onAuthStateChanged` |
| Seeding | JSON asset vs hardcoded array vs remote config | JSON asset is versioned, offline-first, no extra remote call | JSON asset (`assets/exercises-seed.json`) |
| Navigation | Stack + bottom tabs vs drawer | Tabs match the two-domain model; drawer is overkill for MVP | Stack + bottom tabs |
| Firestore path | `users/{uid}/exercises` subcollection vs top-level with `uid` field | Subcollection simplifies security rules and queries | `users/{uid}/exercises` subcollection |

## Data Flow

```
Auth Flow:
App mounts → FirebaseAuthRepository.onAuthStateChanged() → AuthContext
  unauthenticated → AuthStack (Login / Register)
  authenticated   → MainApp (ExercisesTab / ProfileTab)

Exercise CRUD Flow:
Screen → useExercises hook → ExerciseService (use case) → FirestoreExerciseRepository
  → Firestore users/{uid}/exercises → Firestore offline cache → UI re-renders

Seeding Flow:
First login → AuthContext detects new UID → check `users/{uid}/metadata` doc for `seededAt` field
  → if missing: seedExercises() → batch write from JSON → set `seededAt: Timestamp` on metadata doc
  → if exists: skip seeding (user may have deleted all exercises intentionally)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/UserProfile.ts` | Create | UserProfile entity + validation |
| `src/domain/entities/Exercise.ts` | Create | Exercise entity, enums, validation rules |
| `src/domain/entities/AuthCredentials.ts` | Create | AuthCredentials + AuthState value objects |
| `src/domain/repositories/IAuthRepository.ts` | Create | Interface: register, login, logout, getCurrentUser, onAuthStateChanged |
| `src/domain/repositories/IExerciseRepository.ts` | Create | Interface: getAll, getById, create, update, delete, seed |
| `src/domain/errors/AuthError.ts` | Create | Custom error: invalid credentials, email in use, etc. |
| `src/domain/errors/ValidationError.ts` | Create | Custom error: field-level validation failures |
| `src/domain/errors/NetworkError.ts` | Create | Custom error: offline / network failure |
| `src/domain/usecases/RegisterUser.ts` | Create | Orchestrates validation + repository registration |
| `src/domain/usecases/LoginUser.ts` | Create | Orchestrates validation + repository login |
| `src/domain/usecases/SeedExercises.ts` | Create | Checks metadata doc for `seededAt` + triggers repository seed |
| `src/domain/usecases/UpdateProfile.ts` | Create | Updates user display name |
| `src/data/firebase/FirestoreUserMetadataRepository.ts` | Create | Handles `users/{uid}/metadata` doc (seededAt, etc.) |
| `src/data/firebase/firebaseConfig.ts` | Create | Firebase app singleton initialization |
| `src/data/firebase/FirebaseAuthRepository.ts` | Create | Firebase Auth implementation of IAuthRepository |
| `src/data/firebase/FirestoreExerciseRepository.ts` | Create | Firestore implementation of IExerciseRepository |
| `src/data/assets/exercises-seed.json` | Create | ~80 pre-loaded exercises |
| `src/presentation/context/AuthContext.tsx` | Create | React Context exposing user, loading, login, register, logout |
| `src/presentation/hooks/useAuth.ts` | Create | Consumes AuthContext |
| `src/presentation/hooks/useExercises.ts` | Create | Loads, filters, creates, updates exercises via repository |
| `src/presentation/navigation/types.ts` | Create | TypeScript types for all navigators and screen params |
| `src/presentation/navigation/RootNavigator.tsx` | Create | Root navigator: decides AuthStack vs MainApp based on auth state |
| `src/presentation/navigation/AuthStack.tsx` | Create | Login + Register screens |
| `src/presentation/navigation/MainAppTabs.tsx` | Create | Bottom tabs: Exercises, Profile |
| `src/presentation/navigation/ExerciseStack.tsx` | Create | ExerciseList → Detail → Create → Edit |
| `src/presentation/screens/auth/LoginScreen.tsx` | Create | Email/password login UI |
| `src/presentation/screens/auth/RegisterScreen.tsx` | Create | Registration UI with confirm password |
| `src/presentation/screens/exercises/ExerciseListScreen.tsx` | Create | List + filters |
| `src/presentation/screens/exercises/ExerciseDetailScreen.tsx` | Create | Read-only detail for seeded; editable for custom |
| `src/presentation/screens/exercises/ExerciseCreateScreen.tsx` | Create | Form to create custom exercise |
| `src/presentation/screens/exercises/ExerciseEditScreen.tsx` | Create | Form to edit custom exercise |
| `src/presentation/screens/profile/ProfileScreen.tsx` | Create | Email display + editable display name + sign-out button |
| `src/presentation/components/LoadingScreen.tsx` | Create | Shared loading/splash placeholder |
| `src/App.tsx` | Modify | Wire AuthContext + RootNavigator |
| `firestore.rules` | Create | Per-user data isolation rules |
| `app.json` | Modify | Add `extra` for Firebase config env vars if needed |

## Interfaces / Contracts

```typescript
// src/domain/entities/UserProfile.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// src/domain/entities/Exercise.ts
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'legs' | 'core' | 'forearms' | 'glutes' | 'calves';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable'
  | 'bodyweight' | 'kettlebell' | 'band' | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// src/domain/entities/AuthCredentials.ts
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// src/domain/repositories/IAuthRepository.ts
export interface IAuthRepository {
  register(email: string, password: string): Promise<UserProfile>;
  login(email: string, password: string): Promise<UserProfile>;
  logout(): Promise<void>;
  getCurrentUser(): UserProfile | null;
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
}

// src/domain/repositories/IExerciseRepository.ts
export interface IExerciseRepository {
  getAll(uid: string): Promise<Exercise[]>;
  getById(uid: string, exerciseId: string): Promise<Exercise | null>;
  create(uid: string, exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise>;
  update(uid: string, exerciseId: string, data: Partial<Exercise>): Promise<Exercise>;
  delete(uid: string, exerciseId: string): Promise<void>;
  seed(uid: string, exercises: Exercise[]): Promise<void>;
}

// src/domain/repositories/IUserMetadataRepository.ts
export interface IUserMetadataRepository {
  getSeedStatus(uid: string): Promise<{ seededAt: Date | null }>;
  markAsSeeded(uid: string): Promise<void>;
  updateDisplayName(uid: string, displayName: string): Promise<void>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Domain entities, validation rules, use cases | Jest + in-memory stubs for repositories |
| Integration | FirebaseAuthRepository, FirestoreExerciseRepository | Firebase Emulator Suite (Auth + Firestore) with `@firebase/rules-unit-testing` |
| E2E | Auth gate, exercise CRUD, navigation flows | Maestro or Detox (post-MVP, not blocking) |

## Migration / Rollout

No migration required — greenfield project. First launch seeds exercises automatically.

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Add `seededAt` on user metadata doc? | **Yes** | More robust than checking collection emptiness; allows user to delete all exercises without triggering re-seed |
| Profile screen editable display name? | **Yes (Option A)** | Personalizes the app; adds `UpdateProfile` use case; low complexity |

## Open Questions

None remaining.
