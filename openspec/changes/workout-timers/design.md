# Design: Workout Timers

## Technical Approach

Three layered additions on the existing rep-based system:

1. **Domain extensions**: Add `isTimeBased` + `targetDurationSeconds` to `RoutineExercise`, `durationSeconds` to `WorkoutSet`, and `totalDurationSeconds` to `WorkoutSession`. All new fields default to safe values (`false` / `0`) for full backward compatibility.

2. **Session stopwatch**: Pure UI state driven by `Date.now() - startedAt`. Updates every second via `setInterval`, but re-derives on mount and `AppState` focus to eliminate drift. No Firestore writes until session completion.

3. **Per-set inline timer**: Count-up timer embedded in each time-based set row. Start/stop controls. Pauses on `AppState` background, resumes on foreground. Only one active at a time. Stopping records `durationSeconds`, marks set complete, and triggers the existing rest countdown flow.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|----------|---------|-----------|--------|
| Timer derivation | `setInterval` only | Drifts on background | `Date.now()` diff on mount + `AppState` focus; interval for display only |
| Timer state ownership | Context / Reducer | Overkill for ephemeral UI | Screen-level state (session timer) and local row state (per-set timer) |
| Per-set timer placement | Inline row vs floating modal | Modal loses exercise context | Inline row; replaces weight/reps inputs for time-based exercises |
| Firestore writes | Per-second vs final-only | Per-second drains battery/data | Final values only (`durationSeconds` on stop, `totalDurationSeconds` on completion) |
| Routine auto-update for time-based | Average duration vs no update | No update loses progressive overload | Average `durationSeconds` from completed sets replaces `targetDurationSeconds` |

## Data Flow

```
User taps Start Session
  → startSession use case → Firestore create with startedAt
  → SessionTimer mounts → derives elapsed = Date.now() - startedAt
  → 1s interval updates display (no writes)

User taps per-set Start
  → Row state: activeTimerId, startTimestamp, elapsedSeconds
  → 1s interval increments elapsed
  → AppState background → pause; foreground → resume from elapsed

User taps per-set Stop
  → durationSeconds = elapsedSeconds
  → updateSet with { durationSeconds, completed: true }
  → RestTimer triggers via existing onComplete flow

User taps Complete Session
  → completeSession use case
  → totalDurationSeconds = (completedAt - startedAt) / 1000 (rounded)
  → Routine auto-update: rep-based → avg reps; time-based → avg duration
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/Routine.ts` | Modify | Add `isTimeBased`, `targetDurationSeconds`; conditional validation (duration > 0 when time-based) |
| `src/domain/entities/WorkoutSession.ts` | Modify | Add `durationSeconds` to `WorkoutSet`, `totalDurationSeconds` to `WorkoutSession`; update `generateSetsFromRoutine`, `calculateTotalVolume`, `updateWorkoutSet`, `completeWorkoutSession` |
| `src/domain/usecases/workout/CompleteWorkoutSession.ts` | Modify | Calculate and persist `totalDurationSeconds`; update routine with avg duration for time-based exercises |
| `src/domain/usecases/workout/UpdateWorkoutSessionSet.ts` | Modify | Accept optional `durationSeconds` in input |
| `src/data/firebase/firestore/FirestoreRoutineRepository.ts` | Modify | Default `isTimeBased: false`, `targetDurationSeconds: 0` at read boundary |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Modify | Default `durationSeconds: 0`; persist `totalDurationSeconds` on completion |
| `src/presentation/components/SessionTimer.tsx` | Create | Header stopwatch: `Date.now()` diff + `AppState` listener, HH:MM:SS format |
| `src/presentation/components/ExerciseTimer.tsx` | Create | Inline per-set count-up: start/stop, pause on background, single-active enforcement |
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Modify | Add `SessionTimer` to header; gate check/timer buttons behind `sessionId`; render `ExerciseTimer` for time-based sets; pass `durationSeconds` through `updateSet` |
| `src/presentation/screens/routines/RoutineCreateScreen.tsx` | Modify | Add time-based toggle; conditionally show duration input (seconds) instead of reps |
| `src/presentation/screens/routines/RoutineEditScreen.tsx` | Modify | Same |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Modify | Display "N sets × Xs" for time-based exercises |

## Interfaces / Contracts

```typescript
// Routine.ts
export interface RoutineExercise {
  // ... existing fields
  isTimeBased?: boolean;
  targetDurationSeconds?: number;
}

// WorkoutSession.ts
export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  durationSeconds?: number;
}

export interface WorkoutSession {
  // ... existing fields
  totalDurationSeconds?: number;
}

export interface UpdateWorkoutSetInput {
  exerciseIndex: number;
  setIndex: number;
  reps: number;
  weight: number;
  completed: boolean;
  durationSeconds?: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `calculateTotalVolume` skips time-based sets | Manual verification (no test runner) |
| Unit | `generateSetsFromRoutine` seeds `durationSeconds: 0` for time-based | Manual verification |
| Integration | Session timer survives background → foreground | Manual device test |
| Integration | Per-set timer start/stop records correct duration | Manual device test |
| E2E | Full flow: create time-based routine → start session → time sets → complete | Manual QA |

## Migration / Rollout

No migration required. New fields default to safe values at read boundaries. Old Firestore documents retain new fields harmlessly. Existing rep-based routines and sessions behave identically.

## Open Questions

- None
