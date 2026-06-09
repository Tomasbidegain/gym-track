# Exploration: Training Lobby

## Status
`completed`

## Executive Summary

This exploration analyzes restructuring the app navigation to introduce a dedicated **"Train" tab** that separates routine template management (CRUD) from the act of starting a workout. The new flow introduces a training lobby: routine selection → day selection (with weekly completion checkmarks) → workout session. We evaluate navigation changes, weekly tracking strategies, data model impacts, and reuse of existing session infrastructure.

---

## 1. Current State

### 1.1 Navigation

`MainAppTabs` (bottom tab navigator) currently has 4 tabs:

| Tab | Stack | Purpose |
|-----|-------|---------|
| Progress | single screen | Stats, calendar, top exercises |
| Exercises | `ExerciseStack` | Exercise catalog CRUD |
| Routines | `RoutineStack` | Routine CRUD **+** starts workout sessions |
| Profile | single screen | User profile |

`RoutineStack` screens:
- `RoutineList` → `RoutineDetail` → `WorkoutSession` (workout is started from routine detail)
- `RoutineCreate`, `RoutineEdit`, `ExercisePicker`

### 1.2 Routine Entity

```typescript
interface Routine {
  id: string;
  name: string;
  description?: string;
  days: RoutineDay[];
  createdAt: Date;
  updatedAt: Date;
}

interface RoutineDay {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}
```

A routine is a **template** with 1..N days. Each day has an ordered list of exercises with training parameters (targetSets, targetReps, restSeconds).

### 1.3 Workout Session Entity & Flow

```typescript
interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  exercises: WorkoutExercise[];
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  totalVolume: number;
}
```

**Current flow:**
1. User opens `RoutineDetailScreen`, selects a day tab, taps **"Iniciar entrenamiento"**.
2. App navigates to `WorkoutSessionScreen` with `{ routineId, dayIndex }`.
3. `WorkoutSessionScreen` calls `startSession(...)` which creates a Firestore doc under `users/{uid}/workoutSessions`.
4. During the session, sets are tracked and synced. On completion, `completeSession(...)` marks `isCompleted = true` and updates the routine's target sets/reps with averages from completed sets.

### 1.4 Existing Repositories

- `FirestoreRoutineRepository` — `users/{uid}/routines/{routineId}`
- `FirestoreWorkoutSessionRepository` — `users/{uid}/workoutSessions/{sessionId}`
- `FirestoreUserMetadataRepository` — `users/{uid}/metadata/{docId}`

No existing collection or entity tracks per-day weekly completion state.

---

## 2. What Needs to Change

### 2.1 Navigation

1. **Add a "Train" tab** to `MainAppTabs` (new `TrainStack`).
2. **Remove workout-start from `RoutineStack`**. `RoutineDetailScreen` should no longer have the "Iniciar entrenamiento" button; it becomes view-only (plus edit/delete/duplicate).
3. **`TrainStack` screens:**
   - `TrainLobby` — list of user's routines; if only 1 routine, auto-skip to day selection.
   - `DaySelection` — horizontal tabs for each day of the selected routine; completed days show a checkmark and are disabled/tapped-through-blocked.
   - `WorkoutSession` — **reused** from existing screen; navigated with `{ routineId, dayIndex }`.

### 2.2 Weekly Tracking

**Requirement:** You cannot train a day of the week that you already completed. Completed days show a checkmark. Reset when a new week starts.

**Key question:** What defines a "week"?

| Definition | Pros | Cons |
|------------|------|------|
| **Monday 00:00 – Sunday 23:59:59** (calendar week) | Aligns with most fitness apps; easy mental model | User might train Sunday night and Monday morning; feels like same "week" to them |
| **Rolling 7-day window** (last 168h) | Always accurate relative to now | Harder mental model; "week" keeps shifting |
| **User-configurable start day** (e.g. user picks Sunday or Monday) | Most flexible | Extra UI/settings complexity |

**Recommendation:** Calendar week (Monday 00:00 – Sunday 23:59:59 in the user's local timezone) for MVP. Simple, predictable, matches standard fitness tracking.

### 2.3 Approaches for Tracking Completion

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **A. Derive from `workoutSessions`** | No new collection; uses existing data; always consistent with history | Requires querying all completed sessions in current week and filtering by `routineId` + `dayId` on every lobby load; Firestore `where` + `orderBy` needs composite index | Low |
| **B. New `weeklyProgress` document** | Fast single-doc read; explicit state; can store extra metadata (planned days, skipped days) | Extra write on every session completion; needs cleanup/rollover logic; risk of stale data if session deleted | Medium |
| **C. `lastCompletedAt` per day inside `Routine`** | No new collection; colocated with template | Routine doc rewrites on every session; mixes template with instance data; editing routine could accidentally wipe progress | Medium |

**Recommendation:** **Approach A (derive from sessions)** for MVP. The `WorkoutSessionRepository` already supports `getByRoutineId`. We can extend it with a query for completed sessions in the current week, or query all sessions and filter client-side (routines and sessions per user are small enough). If performance becomes an issue later, migrate to Approach B.

---

## 3. Affected Areas

| File / Directory | Why Affected |
|------------------|--------------|
| `src/presentation/navigation/MainAppTabs.tsx` | Add new `Train` tab |
| `src/presentation/navigation/types.ts` | Add `TrainStackParamList`, update `MainAppTabParamList` |
| `src/presentation/navigation/RoutineStack.tsx` | Remove `WorkoutSession` route; remove start-workout button flow |
| `src/presentation/navigation/TrainStack.tsx` | **New file** — lobby + day selection stack |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Remove "Iniciar entrenamiento" button and `WorkoutSession` navigation |
| `src/presentation/screens/train/` | **New directory** — `TrainLobbyScreen`, `DaySelectionScreen` |
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Minor: ensure it still works when navigated from `TrainStack`; verify `headerBackVisible` behavior |
| `src/domain/repositories/IWorkoutSessionRepository.ts` | Add `getCompletedInWeek(uid, routineId, weekStart, weekEnd)` or similar |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Implement new query; may need Firestore composite index |
| `src/presentation/context/WorkoutSessionContext.tsx` | May need to expose new query or helper for lobby consumption |
| `src/domain/entities/WorkoutSession.ts` | Possibly add `weekYear` / `weekNumber` helpers for deterministic week calculation |

---

## 4. Reusable Code

| Component / Hook / Use Case | Reuse Plan |
|-----------------------------|------------|
| `useRoutines` / `RoutineContext` | Lobby screen consumes this to list routines |
| `WorkoutSessionScreen` | **Fully reusable** — accepts `routineId` + `dayIndex` params; no change needed to core logic |
| `generateSetsFromRoutine` | Reused when starting a session from the new flow |
| `startSession`, `updateSet`, `completeSession` from `WorkoutSessionContext` | No changes needed |
| `RestTimer` component | Already used by `WorkoutSessionScreen`; no change |
| Tab + stack patterns (`RoutineStack`, `ExerciseStack`) | Copy-paste-adapt for `TrainStack` |
| Day tab UI from `RoutineDetailScreen` | Extract or replicate the horizontal day tab scroll view with active styling |

---

## 5. Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| **User has 0 routines** | `TrainLobby` shows empty state with CTA to create a routine (navigate to `Routines` tab) |
| **User has 1 routine** | Skip lobby entirely; navigate directly to `DaySelection` for that routine |
| **All days completed for the week** | `DaySelection` shows all tabs checked; primary CTA becomes "View progress" or disabled with message "All done for this week!" |
| **Session started but not completed** | Currently `isCompleted = false` sessions exist. These do **not** count as "completed for the week". Only `isCompleted = true` blocks the day. |
| **User deletes a routine mid-week** | Sessions remain in history (orphaned `routineId` references are acceptable). Lobby simply won't show the deleted routine. |
| **User changes device / timezone** | Week calculation uses local timezone. If user travels, week boundary shifts with local time — acceptable for MVP. |
| **Firestore offline** | Session creation and completion are queued by Firestore offline persistence. Weekly check on lobby load may show stale data until sync completes — acceptable. |
| **Duplicate sessions for same day in same week** | If a user somehow starts a second session for an already-completed day (e.g. via deep link or state bug), the app should block it at `DaySelection` level. |

---

## 6. Data Model Impact

### 6.1 No New Entity Required (MVP)

Using **Approach A**, weekly completion is derived from existing `WorkoutSession` documents:

```typescript
// Helper in domain layer
function getWeekBounds(date: Date): { start: Date; end: Date } {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday ...
  const diffToMonday = (day + 6) % 7; // days since Monday
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
```

```typescript
// In repository
async getCompletedDaysInWeek(
  uid: string,
  routineId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<string[]> {
  // query users/{uid}/workoutSessions
  // where routineId == routineId
  // where isCompleted == true
  // where completedAt >= weekStart
  // where completedAt <= weekEnd
  // return unique dayIds
}
```

> ⚠️ Firestore requires a composite index for multiple `where` + `orderBy` clauses. The repository should use `query` with `where` clauses; if ordering is needed, add `orderBy('completedAt', 'desc')` and create the index in Firebase Console.

### 6.2 Alternative: New `trainingWeek` Document (Future)

If deriving becomes expensive:

```
users/{uid}/trainingWeeks/{weekKey}  (weekKey = "2026-W23")
```

Document shape:
```json
{
  "routineId": "abc",
  "completedDayIds": ["day-1", "day-3"],
  "weekStart": "2026-06-08T00:00:00.000Z",
  "weekEnd": "2026-06-14T23:59:59.999Z"
}
```

This is **out of scope for MVP** but documented here as an evolution path.

---

## 7. Screen Flow

```
MainAppTabs
├── Progress (existing)
├── Exercises (existing)
├── Train (NEW — TrainStack)
│   ├── TrainLobbyScreen
│   │   └── If 1 routine → auto-push DaySelectionScreen
│   └── DaySelectionScreen
│       └── horizontal day tabs (checked = completed)
│       └── tap day → WorkoutSessionScreen
├── Routines (existing — RoutineStack, minus WorkoutSession)
│   ├── RoutineList
│   ├── RoutineDetail (view only, no start button)
│   ├── RoutineCreate
│   ├── RoutineEdit
│   └── ExercisePicker
└── Profile (existing)
```

---

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Firestore composite index needed for week query** | Low | Create index proactively during development; test on emulator first. |
| **Deriving completion from sessions is O(N) client-side** | Low | Per-user session volume is small (<1000/year). Filter client-side if composite index is problematic. |
| **Removing workout start from RoutineDetail may confuse existing users** | Medium | This is a deliberate UX redesign. Communicate in release notes. |
| **Timezone week boundary ambiguity** | Low | Document Monday-based local timezone week. Add user setting later if requested. |
| **WorkoutSessionScreen back navigation** | Low | Currently `headerBackVisible: false` in `RoutineStack`. In `TrainStack`, back behavior should return to `DaySelection` (standard stack behavior). Verify no hardcoded `goBack` assumptions. |

---

## 9. Open Questions for the User

1. **Week definition:** Is Monday–Sunday calendar week acceptable, or do you prefer a different boundary (e.g. Sunday–Saturday)?
2. **Multiple routines:** If a user has multiple routines, should each routine track its own weekly completion independently? (Assumed: yes.)
3. **Partial completion:** If a user starts a day but does not complete the session, should that day be blocked from restarting later in the same week? (Recommendation: no — only fully completed sessions count.)
4. **Checkmark granularity:** Should the checkmark appear on the day tab in `DaySelection` only, or also somewhere in the `TrainLobby` routine list? (Recommendation: both — lobby shows "3/4 days done" badge, day selection shows per-tab checkmarks.)

---

## 10. Next Recommended Phase

**`/sdd-propose`** — Formalize this exploration into a change proposal with intent, scope, rollback plan, and the answers to the open questions above.
