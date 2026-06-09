# Tasks: Training Lobby

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–600 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: week bounds, repository query, use case | PR 1 | Independent; no UI changes |
| 2 | Navigation & lobby: TrainStack, types, lobby screen | PR 2 | Depends on PR 1 for domain exports |
| 3 | Day/session integration: DaySelection, WorkoutSession updates, hook | PR 3 | Depends on PR 2 for navigation |

## Phase 1: Foundation

- [x] 1.1 Add `getWeekBounds(date)` to `src/domain/entities/WorkoutSession.ts`
- [x] 1.2 Add `getCompletedDaysInWeek` to `src/domain/repositories/IWorkoutSessionRepository.ts`
- [x] 1.3 Implement `getCompletedDaysInWeek` in `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts`
- [x] 1.4 Create `src/domain/usecases/workout/GetCompletedDaysInWeek.ts`
- [x] 1.5 Export `GetCompletedDaysInWeek` and `getWeekBounds` from `src/domain/index.ts`

## Phase 2: Navigation

- [x] 2.1 Update `src/presentation/navigation/types.ts`: add `TrainStackParamList`, remove `WorkoutSession` from `RoutineStackParamList`
- [x] 2.2 Create `src/presentation/navigation/TrainStack.tsx`
- [x] 2.3 Add `Train` tab to `src/presentation/navigation/MainAppTabs.tsx`
- [x] 2.4 Remove `WorkoutSession` route from `src/presentation/navigation/RoutineStack.tsx`
- [x] 2.5 Remove start-workout button from `src/presentation/screens/routines/RoutineDetailScreen.tsx`

## Phase 3: Screens & Hook

- [x] 3.1 Create `src/presentation/hooks/useCompletedDaysInWeek.ts`
- [x] 3.2 Create `src/presentation/screens/train/TrainLobbyScreen.tsx` (routine cards, auto-skip when 1 routine)
- [x] 3.3 Enhance `src/presentation/screens/train/DaySelectionScreen.tsx` with checkmarks and block completed days
- [x] 3.4 Update `src/presentation/screens/workout/WorkoutSessionScreen.tsx` with `beforeRemove` prompt, day checkmarks, and day tabs
- [x] 3.5 Add `markSessionComplete` to `src/presentation/context/WorkoutSessionContext.tsx`

## Phase 4: Verification

- [x] 4.1 Verify `getWeekBounds` edge cases (Sunday, Monday, timezone)
- [x] 4.2 Verify Firestore composite query returns correct day IDs
- [x] 4.3 Smoke test: lobby → day selection → session → incomplete exit prompt
- [x] 4.4 Verify checkmarks render on day tabs in both screens

## Phase 5: Cleanup

- [x] 5.1 Remove dead code from `src/presentation/screens/routines/RoutineDetailScreen.tsx`
- [x] 5.2 Document Firestore composite index requirement in README
