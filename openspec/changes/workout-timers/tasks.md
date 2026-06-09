# Tasks: Workout Timers

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 420–500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Domain/Data) → PR 2 (Timers) → PR 3 (Screens) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain & Data layer: types, defaults, validation | PR 1 | base: main; no UI changes |
| 2 | Timer components & use-case logic | PR 2 | base: PR 1 branch; depends on domain changes |
| 3 | Screen integration & routine editor UI | PR 3 | base: PR 2 branch; depends on timers |

## Phase 1: Foundation (Domain & Data)

- [x] 1.1 Add `isTimeBased` and `targetDurationSeconds` to `RoutineExercise` in `src/domain/entities/Routine.ts` with defaults `false`/`0`
- [x] 1.2 Add `durationSeconds` to `WorkoutSet` and `totalDurationSeconds` to `WorkoutSession` in `src/domain/entities/WorkoutSession.ts`
- [x] 1.3 Update `generateSetsFromRoutine` to seed `durationSeconds: 0` and `reps: 0` for time-based exercises
- [x] 1.4 Update `calculateTotalVolume` to skip sets where `durationSeconds > 0` (time-based)
- [x] 1.5 Update `updateWorkoutSet` to accept optional `durationSeconds` parameter
- [x] 1.6 Update `completeWorkoutSession` to compute `totalDurationSeconds` from `completedAt - startedAt`
- [x] 1.7 Update `FirestoreRoutineRepository.ts` to default missing `isTimeBased`/`targetDurationSeconds` to `false`/`0`
- [x] 1.8 Update `FirestoreWorkoutSessionRepository.ts` to default missing `durationSeconds` to `0` and persist `totalDurationSeconds`

## Phase 2: Core Implementation (Timers & Use Cases)

- [x] 2.1 Create `src/presentation/components/SessionTimer.tsx` with `Date.now() - startedAt` derivation, `setInterval` display, and `AppState` foreground correction
- [x] 2.2 Create `src/presentation/components/ExerciseTimer.tsx` with start/stop, count-up, pause on background, resume on foreground, and single-active enforcement
- [x] 2.3 Update `CompleteWorkoutSession.ts` use case to persist `totalDurationSeconds` and update routine average duration for time-based exercises
- [x] 2.4 Update `UpdateWorkoutSessionSet.ts` use case to pass `durationSeconds` through to repository

## Phase 3: Integration (Screens)

- [x] 3.1 Modify `WorkoutSessionScreen.tsx` to add `SessionTimer` to header, gate check/timer buttons until session starts, and render `ExerciseTimer` for time-based sets
- [x] 3.2 Modify `RoutineCreateScreen.tsx` to add time-based toggle and duration input (seconds)
- [x] 3.3 Modify `RoutineEditScreen.tsx` to add time-based toggle and duration input (seconds)
- [x] 3.4 Modify `RoutineDetailScreen.tsx` to display "N sets × Xs" for time-based exercises

## Phase 4: Verification

- [ ] 4.1 Manual test: create time-based routine, verify `isTimeBased` and `targetDurationSeconds` persist
- [ ] 4.2 Manual test: start session, verify session stopwatch increments and survives background
- [ ] 4.3 Manual test: start/stop per-set timer, verify `durationSeconds` recorded and rest timer triggers
- [ ] 4.4 Manual test: complete session, verify `totalDurationSeconds` persisted and volume excludes time-based sets
