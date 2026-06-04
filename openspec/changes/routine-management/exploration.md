# Exploration: Routine Management

## Status
`completed`

## Executive Summary

This exploration defines the **Routine Management** feature: user-created workout templates composed of exercises from the catalog with configurable sets, reps, rest, and order. We analyze data model options, Firestore structure, screen architecture, CRUD flows, and edge cases. The recommendation is a **self-contained Routine document with embedded exercise snapshots** to minimize reads and decouple routines from catalog mutations, while still preserving a reference ID for navigation.

---

## 1. Current State

The app has two working features:

- **Auth**: Email/password login/register, Firebase Auth with AsyncStorage persistence, `AuthContext` gating access.
- **Exercise Catalog**: 80 seeded exercises + custom CRUD, per-user Firestore collection `users/{uid}/exercises/`, searchable/filterable list, detail view, create/edit forms.

Navigation uses React Navigation v6 with a bottom tab (`Exercises`, `Profile`). Each tab hosts its own native stack. The presentation layer follows a consistent pattern:

- `useAuth()` / `useExercises()` hooks encapsulate use cases and local state.
- Screens use `KeyboardAvoidingView`, `ScrollView`, `TouchableOpacity`, and modal pickers.
- Spanish UI labels; English code identifiers and comments.

There is **no routine, workout session, or progress tracking** yet.

---

## 2. Data Model

### 2.1 Recommended Entities

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
  /** Reference to the catalog exercise (for navigation & optional refresh). */
  exerciseId: string;

  /** Snapshot of key fields so the routine renders without extra reads. */
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;

  /** Training parameters configured by the user for this routine. */
  sets: number;              // MUST be >= 1
  reps: string;              // e.g. "8-12", "5", "AMRAP"
  restSeconds: number;        // MUST be >= 0
  orderIndex: number;         // 0-based display order
  notes?: string;             // e.g. "Warm up with empty bar first"
}

export interface RoutineValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
```

### 2.2 Why Snapshot + Reference (Hybrid)

| Approach | Pros | Cons |
|----------|------|------|
| **Reference only** (exerciseId) | Single source of truth; no duplication | N+1 reads to render a routine; breaks if exercise deleted |
| **Embedded snapshot** (no id) | Self-contained; survives deletions | Can't navigate to exercise detail; stale data |
| **Hybrid (recommended)** | Self-contained render + navigation link; can detect stale/deleted exercises | Slight duplication; need to decide when to refresh snapshot |

The hybrid model stores a lightweight snapshot (`name`, `muscleGroup`, `equipment`) plus `exerciseId`. This mirrors how real-world workout apps behave: a routine shows the exercise as it was *at creation time*, but you can still tap through to the current catalog entry.

### 2.3 Relationship with Exercise

- **RoutineExercise is NOT a subtype of Exercise.** It is a *value object* within Routine that references an Exercise.
- **Exercise lifecycle is independent.** Deleting an Exercise does NOT cascade-delete RoutineExercises.
- **UI handles orphaned references.** If `exerciseId` no longer exists in the catalog, the app renders the snapshot with a "Deleted exercise" badge and disables the "View exercise" action.

---

## 3. Firestore Collection Structure

### 3.1 Recommended: Embedded Array (Single Document)

```
users/{uid}/routines/{routineId}  (document)
```

Document shape:

```json
{
  "name": "Push A",
  "description": "Chest focus with shoulders and triceps",
  "exercises": [
    {
      "exerciseId": "abc123",
      "name": "Bench Press",
      "muscleGroup": "chest",
      "equipment": "barbell",
      "sets": 4,
      "reps": "8-12",
      "restSeconds": 90,
      "orderIndex": 0,
      "notes": "Warm up with empty bar first"
    },
    {
      "exerciseId": "def456",
      "name": "Overhead Press",
      "muscleGroup": "shoulders",
      "equipment": "barbell",
      "sets": 3,
      "reps": "8-10",
      "restSeconds": 120,
      "orderIndex": 1
    }
  ],
  "createdAt": <timestamp>,
  "updatedAt": <timestamp>
}
```

**Why not a subcollection?**

- A routine has a bounded, small number of exercises (typically 4–12, rarely >20).
- A single document read is faster and simpler than a collection query + manual assembly.
- Firestore document limit is 1MB. A routine with 50 exercises is ~20KB. Headroom is massive.
- Reordering is a single `updateDoc` rewriting the `exercises` array.

**Why not a separate top-level `routines` collection?**

- The existing security rules already isolate per-user under `users/{uid}/`. Keeping routines in the same hierarchy keeps rules simple and consistent.

### 3.2 Security Rules Update

Append to `firestore.rules`:

```javascript
match /users/{userId}/routines/{routineId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 4. Screen & Navigation Map

### 4.1 New Tab: "Routines"

Add a third tab to `MainAppTabs`:

```typescript
export type MainAppTabParamList = {
  Exercises: undefined;
  Routines: undefined;
  Profile: undefined;
};
```

### 4.2 Routine Stack Screens

```
RoutineStack (NativeStackNavigator)
├── RoutineListScreen          — list all routines, FAB to create
├── RoutineDetailScreen        — view routine with exercise cards
├── RoutineCreateScreen        — name + add exercises + configure params
├── RoutineEditScreen          — same form as create, pre-populated
└── ExercisePickerScreen       — reusable catalog in "picker mode"
```

**Screen descriptions:**

1. **RoutineListScreen**
   - FlatList of routines (name + exercise count).
   - FAB (`+`) to create.
   - Tap to view detail; swipe or long-press for delete.

2. **RoutineDetailScreen**
   - Header: name, description, created/updated dates.
   - Ordered list of `RoutineExerciseCard`s showing sets × reps, rest, notes.
   - Actions: "Edit", "Duplicate", "Delete".
   - If an `exerciseId` is orphaned, show a muted badge.

3. **RoutineCreateScreen**
   - Step 1: Name (required) and optional description.
   - Step 2: "Add exercises" button → pushes `ExercisePickerScreen`.
   - Step 3: For each added exercise, configure sets, reps, rest, notes, and drag to reorder.
   - Validation: name required; at least 1 exercise; sets >= 1; rest >= 0.

4. **RoutineEditScreen**
   - Same UI as create, seeded with existing routine data.
   - Save overwrites `updatedAt`.

5. **ExercisePickerScreen**
   - Reuses the catalog list UI (search, filters) but with checkboxes/multi-select.
   - "Done" button returns selected exercises to the create/edit screen.
   - This can be a modal screen (`presentation: 'modal'`) for better UX on iOS.

### 4.3 Navigation Type Updates

Update `src/presentation/navigation/types.ts`:

```typescript
export type RoutineStackParamList = {
  RoutineList: undefined;
  RoutineDetail: { routineId: string };
  RoutineCreate: undefined;
  RoutineEdit: { routineId: string };
  ExercisePicker: {
    selectedIds: string[];
    onSelect: (exercises: Exercise[]) => void; // NOT serializable — see risks
  };
};
```

> **Note:** Passing a callback via navigation params is NOT serializable in React Navigation. The actual implementation should use a context/hook or a global event emitter for the picker result. See Risks section.

---

## 5. CRUD Flow

### 5.1 Create Routine

```
User taps FAB on RoutineList
  → RoutineCreateScreen
    → Enters name + description
    → Taps "Add exercises"
      → ExercisePickerScreen (modal)
        → User selects 3 exercises, taps "Done"
      → Returns to RoutineCreateScreen with 3 cards
        → User sets sets/reps/rest/notes per exercise
        → User drags to reorder
    → Taps "Save"
      → useRoutine.create() → CreateRoutine use case
        → validates → Firestore addDoc
      → Navigates back to RoutineList
```

### 5.2 Edit Routine

Same flow as create, but seeded. `updatedAt` is rewritten. No versioning for MVP.

### 5.3 Delete Routine

Alert confirmation → `DeleteRoutine` use case → `deleteDoc`. No cascade (routines have no children).

### 5.4 Duplicate Routine

From RoutineDetail, user taps "Duplicate". The app:

1. Fetches the routine document.
2. Creates a new doc with:
   - `name`: `${original.name} (Copia)`
   - `exercises`: deep copy of array
   - fresh `createdAt` / `updatedAt`
3. Navigates to the new routine's detail.

---

## 6. Domain & Data Layer Additions

### 6.1 New Files

```
src/domain/entities/Routine.ts
src/domain/repositories/IRoutineRepository.ts
src/domain/usecases/routine/
  ├── GetRoutines.ts
  ├── GetRoutineById.ts
  ├── CreateRoutine.ts
  ├── UpdateRoutine.ts
  ├── DeleteRoutine.ts
  └── DuplicateRoutine.ts
src/data/firebase/firestore/FirestoreRoutineRepository.ts
src/presentation/hooks/useRoutines.ts
src/presentation/screens/routines/
  ├── RoutineListScreen.tsx
  ├── RoutineDetailScreen.tsx
  ├── RoutineCreateScreen.tsx
  ├── RoutineEditScreen.tsx
  └── ExercisePickerScreen.tsx
src/presentation/navigation/RoutineStack.tsx
```

### 6.2 Repository Interface

```typescript
export interface IRoutineRepository {
  getAll(uid: string): Promise<Routine[]>;
  getById(uid: string, routineId: string): Promise<Routine | null>;
  create(uid: string, routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Routine>;
  update(uid: string, routineId: string, data: Partial<Routine>): Promise<Routine>;
  delete(uid: string, routineId: string): Promise<void>;
}
```

### 6.3 Hook Pattern (`useRoutines.ts`)

Mirror `useExercises.ts`:

- Maintain local `routines` array.
- Filter/sort in memory (sort by `updatedAt` desc or `name` asc).
- Optimistic updates on create/update/delete/duplicate.
- Spanish error messages via `getSpanishErrorMessage()`.

---

## 7. Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| **Exercise deleted after being added to routine** | Routine still renders with snapshot data. Show "Ejercicio eliminado" badge. Disable "Ver ejercicio" button. |
| **Exercise renamed after being added to routine** | Routine keeps old snapshot. User can manually refresh from catalog in edit mode (future enhancement). |
| **Empty routine (0 exercises)** | Validation blocks save. Minimum 1 exercise required. Show error: "Agregá al menos un ejercicio". |
| **Routine with duplicate exercise entries** | ALLOWED. A user might do Bench Press twice (warm-up and work sets). No uniqueness constraint. |
| **Reorder exercises** | Drag-and-drop preferred (`react-native-draggable-flatlist` or similar). For MVP, up/down arrow buttons are acceptable. |
| **Routine name collision** | BLOCK on create/edit if another routine has the same name (case-insensitive). Error: "Ya existe una rutina con ese nombre". |
| **Very long routine name** | Max 100 characters (same as exercise name). |
| **Offline creation** | Firestore offline persistence handles this. Data syncs when online. |

---

## 8. Approaches Compared

### 8.1 Data Model: Snapshot vs. Reference

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Reference only** | No duplication; always current | N+1 reads; broken routines on delete | Medium |
| **Snapshot only** | Self-contained; fast render | Can't link to exercise; stale forever | Low |
| **Hybrid (recommended)** | Best UX; resilient; navigable | Slight duplication; snapshot refresh is manual | Low |

### 8.2 Firestore Structure: Embedded vs. Subcollection

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Embedded array** | Single read; atomic update; simple queries | Entire doc rewrites on small edits | Low |
| **Subcollection** | Granular updates; scales to huge lists | Multiple reads; more complex repository | Medium |

**Recommendation:** Embedded array. Routines are small bounded lists.

### 8.3 Picker: Modal vs. Inline

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **Modal screen** | Reuses catalog UI; clean separation | Navigation param serialization issues | Low |
| **Inline section** | No navigation; easy state sharing | Clutters create/edit screen | Medium |

**Recommendation:** Modal screen (`presentation: 'modal'`) with a temporary selection state held in a picker hook/context.

---

## 9. Risks & Open Questions

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Exercise picker callback not serializable** | Medium | Use a temporary selection store (React Context or a picker result emitter) instead of navigation params. |
| **Drag-and-drop dependency** | Low | Use up/down buttons for MVP; add `react-native-draggable-flatlist` later if needed. |
| **Routine snapshot drift from catalog** | Low | Acceptable for MVP. Add "Refresh exercise info" button in edit mode later. |
| **Firestore document growth** | Very Low | 1MB limit is ~5000+ exercises. Normal routines are <20. |
| **Offline duplicate name check** | Low | Hook-level check against local state is sufficient for MVP. Server-side enforcement via rules is hard with Firestore. |
| **Future Workout Session coupling** | Medium | Routines are templates. Future `WorkoutSession` should snapshot Routine at session start (deep copy), NOT reference it, so historical sessions don't change when routines are edited. |

### Open Questions

1. Should reps be a free-text string ("8-12", "5", "AMRAP") or a structured min/max number? **Recommendation:** Free-text string for MVP — it's the most flexible and matches how users think.
2. Should we support supersets/circuits (grouped exercises)? **Answer:** Out of scope for MVP. Add a `groupId` field to `RoutineExercise` later if needed.
3. Should routines be shareable between users? **Answer:** Out of scope. Requires public collections and user-to-user permissions.

---

## 10. Dependencies

No new runtime dependencies are required for MVP. Optional future additions:

- `react-native-draggable-flatlist` — for drag-to-reorder (can defer).
- `@react-native-picker/picker` — if we want native pickers for sets/rest (current modal picker pattern is fine).

---

## Next Recommended Phase

**`/sdd-propose`** — Formalize this exploration into a change proposal with intent, scope, and rollback plan.
