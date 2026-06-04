# Design: Routine Management

## Technical Approach

Mirror the existing exercises feature pattern: domain entities → use cases → `IRoutineRepository` → `FirestoreRoutineRepository` → `useRoutines` hook → screens. Routine stored as a single Firestore document with an embedded `exercises` array (bounded <20 exercises, well within 1MB limit). Atomic reads/writes; no subcollection overhead.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|----------|---------|-----------|--------|
| RoutineExercise model | Hybrid snapshot+reference vs pure reference | Snapshot self-renders offline; pure reference needs catalog join every time | **Hybrid**: `exerciseId` + `exerciseName` snapshot |
| Firestore layout | Embedded array vs subcollection | Array is atomic read/write and fits <20 items; subcollection adds query complexity | **Embedded array** in `users/{uid}/routines/{routineId}` |
| Picker result transport | Route params callback vs temporary context | React Navigation v6 params cannot serialize callbacks | **Temporary picker context** (`ExercisePickerContext`) |
| Reorder UX | Up/down buttons vs drag-and-drop | Buttons are simpler, no extra dependency; drag-and-drop needs `react-native-draggable-flatlist` | **Up/down buttons** (drag-and-drop deferred) |
| Duplicate name guard | Client-side only vs server unique index | Client-side is sufficient for MVP; server index adds complexity | **Client-side** check against local `routines` state |
| Navigation tab count | 2 tabs (routines inside Exercises) vs 3 tabs | 3 tabs gives routines equal visibility; 2 tabs reduces navigation depth | **3 tabs**: Exercises, Routines, Profile |

## Data Flow

```
Create/Edit Routine:
Screen → useRoutines (reads RoutineContext) → Routine use case → FirestoreRoutineRepository
  → Firestore users/{uid}/routines → RoutineContext updates → UI re-renders

Exercise Picker:
RoutineCreateScreen / RoutineEditScreen → navigate to ExercisePickerScreen
  → ExercisePickerContext holds selection → "Done" → pop → parent reads context

Routine List:
RoutineListScreen → useRoutines (reads RoutineContext) → UI renders from cache
  → pull-to-refresh triggers RoutineContext.refresh() → FirestoreRoutineRepository
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/Routine.ts` | Create | Routine + RoutineExercise entities, validation, orphaned detection |
| `src/domain/repositories/IRoutineRepository.ts` | Create | Interface: getAll, getById, create, update, delete, duplicate |
| `src/domain/errors/RoutineError.ts` | Create | RoutineNotFoundError, DuplicateRoutineNameError |
| `src/domain/usecases/routine/GetRoutines.ts` | Create | Fetch all routines for user |
| `src/domain/usecases/routine/GetRoutineById.ts` | Create | Fetch single routine |
| `src/domain/usecases/routine/CreateRoutine.ts` | Create | Validate + create routine |
| `src/domain/usecases/routine/UpdateRoutine.ts` | Create | Validate + update routine |
| `src/domain/usecases/routine/DeleteRoutine.ts` | Create | Delete routine by ID |
| `src/domain/usecases/routine/DuplicateRoutine.ts` | Create | Clone with "(Copia)" suffix |
| `src/data/firebase/firestore/FirestoreRoutineRepository.ts` | Create | Firestore CRUD + duplicate implementation |
| `src/presentation/hooks/useRoutines.ts` | Create | Hook with local state, filtering, optimistic updates |
| `src/presentation/context/RoutineContext.tsx` | Create | Global routine state: list, loading, currentRoutine (for sessions) |
| `src/presentation/context/ExercisePickerContext.tsx` | Create | Temporary shared state for picker → create/edit screens |
| `src/presentation/navigation/types.ts` | Modify | Add RoutineStackParamList, MainAppTabParamList "Routines" |
| `src/presentation/navigation/MainAppTabs.tsx` | Modify | Add "Routines" tab with RoutineStack |
| `src/presentation/navigation/RoutineStack.tsx` | Create | Stack navigator for routine screens |
| `src/presentation/screens/routines/RoutineListScreen.tsx` | Create | List + empty state + sort |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Create | Detail with exercises, orphaned badges, duplicate action |
| `src/presentation/screens/routines/RoutineCreateScreen.tsx` | Create | Form + navigate to picker |
| `src/presentation/screens/routines/RoutineEditScreen.tsx` | Create | Pre-populated form + picker |
| `src/presentation/screens/exercises/ExercisePickerScreen.tsx` | Create | Multi-select from catalog with search/filter |
| `src/domain/index.ts` | Modify | Export new entities, errors, use cases, repository |
| `firestore.rules` | Modify | Add `users/{uid}/routines/{routineId}` rule |

## Interfaces / Contracts

```typescript
// src/domain/entities/Routine.ts
export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  order: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes?: string;
}

export interface RoutineValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRoutineInput(data: {
  name?: string;
  exercises?: RoutineExercise[];
}): RoutineValidationResult;

export function isOrphaned(
  routineExercise: RoutineExercise,
  catalog: Exercise[],
): boolean;

// src/domain/repositories/IRoutineRepository.ts
export interface IRoutineRepository {
  getAll(uid: string): Promise<Routine[]>;
  getById(uid: string, routineId: string): Promise<Routine | null>;
  create(uid: string, routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Routine>;
  update(uid: string, routineId: string, data: Partial<Routine>): Promise<Routine>;
  delete(uid: string, routineId: string): Promise<void>;
  duplicate(uid: string, routineId: string): Promise<Routine>;
}

// src/domain/errors/RoutineError.ts
export class RoutineNotFoundError extends Error {}
export class DuplicateRoutineNameError extends Error {}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `Routine` entity validation, `isOrphaned`, use cases (Create, Update, Duplicate) | Jest with in-memory stub repository |
| Integration | `FirestoreRoutineRepository` CRUD + duplicate | Firebase Emulator Suite with `@firebase/rules-unit-testing` |
| E2E | Routine CRUD flow, picker flow, orphaned badge | Maestro or Detox (post-MVP) |

## Migration / Rollout

No data migration required. New `users/{uid}/routines` collection is empty for all users. Firestore rules update is backward-compatible.

## Resolved Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Add `RoutineContext`? | **Yes** | Prepares architecture for WorkoutSession where routine state must be accessible from multiple navigation branches without prop drilling |
| Server-side unique names? | **Client-side only for MVP** | Sufficient for single-user app; Cloud Function adds unnecessary complexity |

## RoutineContext Design

`RoutineContext` lives above `MainAppTabs` (in `App.tsx`) and provides:
- `routines: Routine[]` — cached list (refreshed on focus)
- `loading: boolean`
- `error: Error | null`
- `currentRoutine: Routine | null` — the routine selected for an active workout session
- `refresh(): Promise<void>` — manual refetch

**Why above MainAppTabs?** Future `WorkoutSession` screens may live outside the tab structure (e.g., a modal stack). Having `RoutineContext` at the root allows any screen to read the current routine without prop drilling.

`useRoutines()` hook continues to exist and simply consumes `RoutineContext`. Screens that only need the list (e.g., `RoutineListScreen`) use `useRoutines()`. Screens that need to set the current routine (e.g., `WorkoutSessionScreen` in the future) use `RoutineContext` directly.

## Open Questions

- [ ] Do we want to enforce server-side unique routine names via a Cloud Function later, or keep client-side only for MVP?

