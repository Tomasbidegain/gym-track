# Exploration: Workout Timers

## Current State

The app supports workout sessions with rep-based exercises only. A session is created when the user taps "Iniciar entrenamiento", which persists a `WorkoutSession` to Firestore. During the session, users input weight and reps per set, then tap a circular check button to mark a set complete (which triggers a rest countdown timer).

There is NO session-level elapsed-time timer, NO concept of duration-based exercises, and check buttons are visible (but disabled) before the session starts. The `RestTimer` component is the only existing timer — a countdown overlay with pause/resume, cancel, and quick-add time controls.

## Affected Areas

- `src/domain/entities/Routine.ts` — add `isTimeBased`, `targetDurationSeconds` to `RoutineExercise`; update validation
- `src/domain/entities/WorkoutSession.ts` — add `durationSeconds` to `WorkoutSet`; add `totalDurationSeconds` to `WorkoutSession`; update `generateSetsFromRoutine` and volume calculation
- `src/presentation/screens/workout/WorkoutSessionScreen.tsx` — session stopwatch, hide checks before start, conditional UI for time-based exercises, per-exercise/per-set stopwatch
- `src/presentation/components/SessionTimer.tsx` — new component for the session-level elapsed-time display
- `src/presentation/components/ExerciseTimer.tsx` — new component for per-set stopwatch (count-up) for time-based exercises
- `src/presentation/screens/routines/RoutineCreateScreen.tsx` — toggle for time-based + duration input
- `src/presentation/screens/routines/RoutineEditScreen.tsx` — same
- `src/presentation/screens/routines/RoutineDetailScreen.tsx` — display time-based format (e.g., "3 sets x 45s")
- `src/data/firebase/firestore/FirestoreRoutineRepository.ts` — persist new RoutineExercise fields (no structural changes needed, uses inline days array)
- `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` — persist new WorkoutSet/session fields

## Approaches

### 1. Flag on RoutineExercise (`isTimeBased`)

Add `isTimeBased: boolean` and `targetDurationSeconds: number` to `RoutineExercise`. When `isTimeBased` is true, the routine editor shows a "Duration (s)" input instead of "Reps", and the session screen shows a stopwatch per set instead of a reps input. `WorkoutSet` gains `durationSeconds: number`.

- **Pros:** Minimal model change, fully backward compatible, easy to understand, Firestore-friendly (no union types), existing screens need only conditional rendering
- **Cons:** `WorkoutSet` will have both `reps` and `durationSeconds`, with one being unused per exercise; slightly less type-safe than a union
- **Effort:** Medium

### 2. Discriminated Union Type for RoutineExercise

Define `RoutineExercise` as a union of `RoutineExerciseReps` and `RoutineExerciseDuration`. This would cascade through all code that touches exercises.

- **Pros:** Compile-time type safety, no phantom fields
- **Cons:** Extremely invasive; every screen, repository, validation function, and utility would need refactoring; Firestore does not natively support unions; overkill for this feature
- **Effort:** High

### 3. Session Timer Persistence Strategy — In-Memory Only

The session-level stopwatch runs purely in UI state (`useState` + `setInterval`). When the session is completed, `totalDurationSeconds` is computed and stored on the `WorkoutSession` record.

- **Pros:** Simple, no Firestore write pressure every second, timer survives local navigation within the screen
- **Cons:** Timer resets if the app is killed mid-session (but `startedAt` is persisted, so on re-entry we could derive elapsed time from `Date.now() - startedAt`)
- **Effort:** Low

### 4. Per-Exercise Timer — One Timer per Exercise (Shared Across Sets)

A single stopwatch per exercise that the user starts/stops. When they finish a timed set, they tap to record the elapsed duration for that set, then the timer resets for the next set.

- **Pros:** Simpler UI than a timer per set row, consistent with how rest timer works (one overlay per exercise)
- **Cons:** Less granular; user can't time multiple sets of the same exercise concurrently
- **Effort:** Medium

### 5. Per-Set Timer — One Timer per Set Row

Each set row for a time-based exercise has its own start/stop timer button.

- **Pros:** Maximum granularity, clear which set is being timed
- **Cons:** More UI clutter; more state to manage
- **Effort:** Medium

## Recommendation

**Approach 1 (flag) + Approach 3 (in-memory session timer) + Approach 5 (per-set timer)**

- Use a simple `isTimeBased` flag on `RoutineExercise`. It is the pragmatic choice for this codebase and keeps Firestore persistence straightforward.
- Session timer runs in-memory on `WorkoutSessionScreen`. Compute `totalDurationSeconds` at completion time and persist it. For robustness against backgrounding, derive elapsed time from `Date.now() - startedAt` when the screen re-mounts instead of relying solely on `setInterval` incrementing a counter.
- Per-set timer: each time-based set row gets a small start/stop timer button (similar style to the check button). When the user taps start, a small inline timer counts up; tapping stop records the duration and marks the set complete. This avoids an extra overlay and keeps the UX close to the current check-button pattern.

## Risks

- **App backgrounding / OS throttling:** `setInterval` is unreliable when the app is backgrounded on mobile. Mitigation: use `Date.now()` diff approach for the session timer, and stop per-set timers on `AppState` change to background.
- **Firestore schema migration:** Existing routines and sessions lack the new fields. Firestore reads will return `undefined`, which must be handled gracefully (default `isTimeBased` to `false`, `targetDurationSeconds` to `0`). `cleanUndefinedValues` already strips undefined before writes, so no crash risk.
- **Volume calculation for time-based exercises:** `calculateTotalVolume` currently does `weight * reps`. For time-based sets, volume should probably be `weight * durationSeconds` or simply ignored. A decision is needed.
- **Rest timer interaction:** If a time-based exercise also has rest seconds, after stopping the per-set timer the rest countdown should still trigger. Need to ensure the two timer systems don't conflict.
- **Routine auto-update on completion:** `handleCompleteSession` currently averages `reps` from completed sets to update routine targets. For time-based exercises, it should average `durationSeconds` instead.

## Ready for Proposal

**Yes.** The scope is clear, the affected files are identified, and the recommended approach is pragmatic. No additional user clarification is needed — the user explicitly delegated UX/UI decisions to the implementer.
