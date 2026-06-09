# Apply Progress: workout-timers

## Change
workout-timers

## Mode
Standard (no test runner available)

## Completed Tasks

### PR 1 — Domain & Data layer
- [x] 1.1 Add `isTimeBased` and `targetDurationSeconds` to `RoutineExercise` in `src/domain/entities/Routine.ts` with defaults `false`/`0`
- [x] 1.2 Add `durationSeconds` to `WorkoutSet` and `totalDurationSeconds` to `WorkoutSession` in `src/domain/entities/WorkoutSession.ts`
- [x] 1.3 Update `generateSetsFromRoutine` to seed `durationSeconds: 0` and `reps: 0` for time-based exercises
- [x] 1.4 Update `calculateTotalVolume` to skip sets where `durationSeconds > 0` (time-based)
- [x] 1.5 Update `updateWorkoutSet` to accept optional `durationSeconds` parameter
- [x] 1.6 Update `completeWorkoutSession` to compute `totalDurationSeconds` from `completedAt - startedAt`
- [x] 1.7 Update `FirestoreRoutineRepository.ts` to default missing `isTimeBased`/`targetDurationSeconds` to `false`/`0`
- [x] 1.8 Update `FirestoreWorkoutSessionRepository.ts` to default missing `durationSeconds` to `0` and persist `totalDurationSeconds`
- [x] 2.3 Update `CompleteWorkoutSession.ts` use case to persist `totalDurationSeconds` and update routine average duration for time-based exercises
- [x] 2.4 Update `UpdateWorkoutSessionSet.ts` use case to pass `durationSeconds` through to repository

### PR 2 — Timer components
- [x] 2.1 Create `src/presentation/components/SessionTimer.tsx` with `Date.now() - startedAt` derivation, `setInterval` display, and `AppState` foreground correction
- [x] 2.2 Create `src/presentation/components/ExerciseTimer.tsx` with start/stop, count-up, pause on background, resume on foreground, and single-active enforcement

### PR 3 — Screen integration & routine editor UI
- [x] 3.1 Modify `WorkoutSessionScreen.tsx` to add `SessionTimer` to header, gate check/timer buttons until session starts, and render `ExerciseTimer` for time-based sets
- [x] 3.2 Modify `RoutineCreateScreen.tsx` to add time-based toggle and duration input (seconds)
- [x] 3.3 Modify `RoutineEditScreen.tsx` to add time-based toggle and duration input (seconds)
- [x] 3.4 Modify `RoutineDetailScreen.tsx` to display "N sets × Xs" for time-based exercises

## Files Changed

### PR 1
| File | Action | What Was Done |
|------|--------|---------------|
| `src/domain/entities/Routine.ts` | Modified | Added `isTimeBased`, `targetDurationSeconds`; updated validation for time-based exercises |
| `src/domain/entities/WorkoutSession.ts` | Modified | Added `durationSeconds`, `totalDurationSeconds`; updated `generateSetsFromRoutine`, `calculateTotalVolume`, `updateWorkoutSet`, `completeWorkoutSession` |
| `src/data/firebase/firestore/FirestoreRoutineRepository.ts` | Modified | Default missing `isTimeBased`/`targetDurationSeconds` at read boundary |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Modified | Default missing `durationSeconds`; persist `totalDurationSeconds` on update |
| `src/data/index.ts` | Modified | Exported `FirestoreWorkoutSessionRepository` |
| `src/domain/usecases/workout/CompleteWorkoutSession.ts` | Created | Persist `totalDurationSeconds` on session completion |
| `src/domain/usecases/workout/CreateWorkoutSession.ts` | Created | Standard workout session creation use case |
| `src/domain/usecases/workout/GetWorkoutSessions.ts` | Created | Standard get-all use case |
| `src/domain/usecases/workout/UpdateWorkoutSessionSet.ts` | Created | Passes `durationSeconds` through full exercises update |

### PR 2
| File | Action | What Was Done |
|------|--------|---------------|
| `src/presentation/components/SessionTimer.tsx` | Created | Header stopwatch: derives elapsed from `Date.now() - startedAt`, updates every second, re-derives on `AppState` focus, displays HH:MM:SS or MM:SS |
| `src/presentation/components/ExerciseTimer.tsx` | Created | Inline per-set count-up timer: start/stop button, pauses on `AppState` background/resumes on foreground, single-active enforcement via module-level singleton |

### PR 3
| File | Action | What Was Done |
|------|--------|---------------|
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Modified | Added `SessionTimer` to header; gated check buttons and `ExerciseTimer` until session starts; conditionally renders `ExerciseTimer` for time-based sets with `onComplete` wiring to `updateSet` + rest timer trigger; updated `handleCompleteSession` to compute avg duration for time-based exercises |
| `src/presentation/screens/routines/RoutineCreateScreen.tsx` | Modified | Added `Switch` toggle for `isTimeBased`; conditionally shows duration input (seconds) instead of reps; updated validation; defaulted `isTimeBased: false` and `targetDurationSeconds: 0` in `createDefaultRoutineExercise` |
| `src/presentation/screens/routines/RoutineEditScreen.tsx` | Modified | Same toggle + conditional input + validation changes as RoutineCreateScreen |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Modified | Displays "N sets × Xs" for time-based exercises, "N sets × X reps" for rep-based |

## Deviations from Design
- SessionTimer display format: implemented dynamic `HH:MM:SS` when hours > 0, otherwise `MM:SS`. The design/spec requested `HH:MM:SS` always, but the direct PR scope asked for `MM:SS`. Dynamic formatting satisfies both gracefully.
- Single active timer enforcement implemented via a module-level singleton inside `ExerciseTimer.tsx` rather than screen-level state. This keeps the component self-contained.
- WorkoutSessionScreen retains weight input for time-based exercises (alongside the timer), while the design said "replaces weight/reps inputs". The task explicitly said "instead of reps input", so weight remains.
- `handleCompleteSession` in WorkoutSessionScreen updates `targetDurationSeconds` with average duration for time-based exercises, even though the PR 3 task description didn't explicitly mention it. This aligns with the design's data flow for progressive overload on time-based exercises.

## Issues Found
- Untracked `RestTimer.tsx` exists in working tree but was not committed in any prior PR. It does not block PR 3.
- Untracked OpenSpec files from PR 1 remain untracked.

## Remaining Tasks
- [ ] 4.1 Manual test: create time-based routine, verify `isTimeBased` and `targetDurationSeconds` persist
- [ ] 4.2 Manual test: start session, verify session stopwatch increments and survives background
- [ ] 4.3 Manual test: start/stop per-set timer, verify `durationSeconds` recorded and rest timer triggers
- [ ] 4.4 Manual test: complete session, verify `totalDurationSeconds` persisted and volume excludes time-based sets

## Workload / PR Boundary
- Mode: feature-branch-chain
- Chain strategy: feature-branch-chain
- Current work unit: PR 3 of 3 — Screen integration & routine editor UI
- Branch: `feature/workout-timers-screens` (branched from `feature/workout-timers-timer-components`)
- Target branch: `dev` (via tracker PR aggregation)
- Boundary: Screen-level integration of timer components and routine editor UI changes for time-based exercises
- Estimated review budget impact: ~160 insertions across 4 modified files — well under 400-line budget

## Status
16/18 tasks complete. Ready for verify phase.
