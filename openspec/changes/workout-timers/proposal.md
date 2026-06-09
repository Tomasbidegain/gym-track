# Proposal: Workout Timers

## Intent

Add time-based exercise support and session stopwatch. Currently only rep-based exercises exist; users cannot time duration-based exercises (planks, wall sits) or see session elapsed time. Check buttons are visible before session start, causing UX confusion.

## Scope

### In Scope
- `isTimeBased` flag + `targetDurationSeconds` on `RoutineExercise`
- `durationSeconds` on `WorkoutSet`, `totalDurationSeconds` on `WorkoutSession`
- Session-level stopwatch: in-memory, `Date.now() - startedAt` for robustness
- Per-set inline start/stop timer for time-based exercise rows
- Hide check/timer buttons until session starts (`isStarted` gate)
- Routine editor: time-based toggle + duration in seconds input
- Routine detail: display "N sets × Xs" format
- Volume calc: skip time-based sets (user decision: IGNORE)

### Out of Scope
- Server-side timer sync / multi-device
- Per-second Firestore writes (only final duration on completion)
- Discriminated union types for RoutineExercise
- Per-exercise shared timer (chose per-set approach)

## Capabilities

### New Capabilities
- `workout-session-timer`: Session elapsed-time display, in-memory with `Date.now()` diff derivation on mount/refocus
- `time-based-exercises`: `RoutineExercise` gains `isTimeBased` + `targetDurationSeconds`; routine CRUD supports time-based definitions
- `per-set-timer`: Inline start/stop count-up per set row for time-based exercises; records `durationSeconds` on stop

### Modified Capabilities
None — no existing specs.

## Approach

Three layered additions on top of the existing rep-based system:

1. **Domain entities**: Extend `RoutineExercise` (+`isTimeBased`, +`targetDurationSeconds`), `WorkoutSet` (+`durationSeconds`), `WorkoutSession` (+`totalDurationSeconds`). All new fields default to `false`/`0` — fully backward compatible. `generateSetsFromRoutine` seeds `durationSeconds: 0` for time-based sets. `calculateTotalVolume` skips time-based sets. `updateWorkoutSet` accepts optional `durationSeconds`.

2. **Session timer** (`SessionTimer` component): Pure UI state — 1s interval updating display, anchored to `Date.now() - startedAt` on mount and `AppState` focus. No Firestore writes until completion.

3. **Per-set timer** (inline in set row): Each time-based set gets a small play/stop button. Tapping play starts count-up; tapping stop records `durationSeconds`, marks set complete, triggers rest timer. Pauses on `AppState` background.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/entities/Routine.ts` | Modified | +`isTimeBased`, +`targetDurationSeconds`; conditional validation |
| `src/domain/entities/WorkoutSession.ts` | Modified | +`durationSeconds` on set, +`totalDurationSeconds` on session; update generators |
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Modified | Session stopwatch, hide checks before start, time-based conditional UI |
| `src/presentation/components/SessionTimer.tsx` | New | Session elapsed-time display |
| `src/presentation/components/ExerciseTimer.tsx` | New | Per-set inline start/stop count-up |
| `src/presentation/screens/routines/RoutineCreateScreen.tsx` | Modified | Time-based toggle + duration input |
| `src/presentation/screens/routines/RoutineEditScreen.tsx` | Modified | Same |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Modified | "N sets × Xs" display |
| `src/data/firebase/firestore/FirestoreRoutineRepository.ts` | Modified | Persist new RoutineExercise fields |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Modified | Persist new set/session fields |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `setInterval` drift on mobile backgrounding | High | Session: `Date.now()` diff on mount/focus. Per-set: pause on `AppState` background |
| Undefined Firestore fields on old records | Low | Default at read boundaries: `isTimeBased: false`, durations to `0` |
| Per-set timer + rest countdown conflict | Medium | Per-set stop triggers rest via existing `onComplete` flow; one timer active at a time |
| Routine auto-update uses wrong metric | Low | Branch on `isTimeBased`: average `durationSeconds` instead of `reps` |

## Rollback Plan

1. Revert entity changes — new fields default to safe values, old clients read normally
2. Remove `SessionTimer` and `ExerciseTimer` components
3. Remove time-based toggle from routine screens
4. Firestore documents retain new fields harmlessly (no migration needed)

## Dependencies

None — no new packages. All timers use React Native built-ins (`Date`, `setInterval`, `AppState`).

## Success Criteria

- [ ] Time-based exercise creatable in routine editor with duration in seconds
- [ ] Session elapsed time survives app backgrounding
- [ ] Per-set timer starts/stops and records correct duration
- [ ] Check/timer buttons hidden until session starts
- [ ] Completed session stores `totalDurationSeconds`
- [ ] Volume calculation excludes time-based sets
- [ ] Existing rep-based routines and sessions unaffected
