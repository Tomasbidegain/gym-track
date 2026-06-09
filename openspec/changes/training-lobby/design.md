# Design: Training Lobby

## Technical Approach

Separate routine CRUD from training by introducing a `Train` tab with its own stack. Weekly completion is derived from existing `workoutSessions` via a time-bounded query; no new collections are added. `WorkoutSessionScreen` is decoupled from `RoutineStack` and updated to accept `TrainStack` route params. Incomplete-session exit handling hooks into React Navigation's `beforeRemove` event.

## Architecture Decisions

| Decision | Option | Tradeoff | Rationale |
|----------|--------|----------|-----------|
| Weekly completion source | Derive from `workoutSessions` | No migration, but query cost | Proposal explicitly rejects a new collection; `completedAt` + `isCompleted` already exist |
| Week boundary helper | Pure `getWeekBounds(date)` in entity | Tight coupling to entity module | Keeps logic testable and reusable; Monday–Sunday local time per user decision |
| Firestore query strategy | Compound `where` on `routineId`, `isCompleted`, `completedAt` | Requires composite index; fallback to client-side filter if index missing | Single round-trip; Firestore limit of 10 composite indexes is acceptable |
| Incomplete session exit | `beforeRemove` listener + `Alert` | Only catches navigation events; OS back gesture on Android needs `BackHandler` | Follows React Navigation pattern; add `BackHandler` fallback for Android |
| Day tabs in WorkoutSession | Reuse same completion hook as DaySelection | Extra data fetch on session screen | Consistent checkmarks per spec; acceptable for small dataset |

## Data Flow

```
TrainLobbyScreen ──→ DaySelectionScreen ──→ WorkoutSessionScreen
       │                     │                         │
       │              useCompletedDaysInWeek      useCompletedDaysInWeek
       │                     │                         │
       └──────────── GetCompletedDaysInWeek (use case)
                              │
                              ▼
              FirestoreWorkoutSessionRepository.getCompletedDaysInWeek
                              │
                              ▼
              workoutSessions: where routineId==x AND isCompleted==true
                              AND completedAt between weekStart..weekEnd
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/presentation/navigation/types.ts` | Modify | Add `TrainStackParamList`; remove `WorkoutSession` from `RoutineStackParamList`; add `TrainScreenProps` |
| `src/presentation/navigation/MainAppTabs.tsx` | Modify | Add `Train` tab pointing to `TrainStack` |
| `src/presentation/navigation/TrainStack.tsx` | Create | Stack with `TrainLobby`, `DaySelection`, `WorkoutSession` |
| `src/presentation/navigation/RoutineStack.tsx` | Modify | Remove `WorkoutSession` route and import |
| `src/presentation/screens/train/TrainLobbyScreen.tsx` | Create | Routine cards; auto-skip to `DaySelection` when 1 routine |
| `src/presentation/screens/train/DaySelectionScreen.tsx` | Create | Day tabs with checkmarks; block completed days |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Modify | Remove start-workout button and `Alert` debug call |
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Modify | Change props to `TrainScreenProps`; add `beforeRemove` exit prompt; add day tab checkmarks |
| `src/domain/entities/WorkoutSession.ts` | Modify | Add `getWeekBounds(date)` helper |
| `src/domain/repositories/IWorkoutSessionRepository.ts` | Modify | Add `getCompletedDaysInWeek(uid, routineId, weekStart, weekEnd)` |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Modify | Implement `getCompletedDaysInWeek` with Firestore query; fallback to client filter |
| `src/domain/usecases/workout/GetCompletedDaysInWeek.ts` | Create | Thin use-case wrapper around repository method |
| `src/presentation/hooks/useCompletedDaysInWeek.ts` | Create | Hook consuming use case; returns `Set<dayId>` and loading state |
| `src/domain/index.ts` | Modify | Export `GetCompletedDaysInWeek` and `getWeekBounds` |
| `src/presentation/context/WorkoutSessionContext.tsx` | Modify | Add `markSessionComplete` helper for incomplete exit prompt |

## Interfaces / Contracts

```typescript
// entities/WorkoutSession.ts
export function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date };

// repositories/IWorkoutSessionRepository.ts
getCompletedDaysInWeek(
  uid: string,
  routineId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<string[]>; // returns dayIds

// navigation/types.ts
export type TrainStackParamList = {
  TrainLobby: undefined;
  DaySelection: { routineId: string };
  WorkoutSession: { routineId: string; dayId: string };
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `getWeekBounds` edge cases (Sunday, Monday, timezone) | Manual verification; no runner available |
| Unit | `GetCompletedDaysInWeek` use case | Manual verification |
| Integration | Firestore compound query fallback | Dev build + Firebase console index creation |
| E2E | Full lobby → day select → session → exit prompt → completion | Manual smoke test on device/simulator |

## Migration / Rollout

No data migration required. Create the Firestore composite index for `workoutSessions` (`routineId` + `isCompleted` + `completedAt`) in the Firebase console during development. Rollback: revert navigation changes, restore `WorkoutSession` in `RoutineStack`, re-add start button to `RoutineDetailScreen`.

## Open Questions

- [ ] Should the composite index be documented in README for new environments?
- [ ] Does `dayId` uniquely identify a day within a routine (it does per current `RoutineDay` interface)?
