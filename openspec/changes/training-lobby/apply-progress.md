# Apply Progress: Training Lobby

## Mode
Standard (no test runner available; strict_tdd: false)

## Delivery Strategy
- **Mode**: force-chained PR
- **Chain strategy**: feature-branch-chain
- **Target branch**: dev
- **Current slice**: PR 1 of 3 (Foundation)
- **Workload decision**: Resolved by orchestrator — force-chained, feature-branch-chain

## Completed Tasks

### Phase 1: Foundation
- [x] 1.1 Add `getWeekBounds(date)` to `src/domain/entities/WorkoutSession.ts`
- [x] 1.2 Add `getCompletedDaysInWeek` to `src/domain/repositories/IWorkoutSessionRepository.ts`
- [x] 1.3 Implement `getCompletedDaysInWeek` in `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts`
- [x] 1.4 Create `src/domain/usecases/workout/GetCompletedDaysInWeek.ts`
- [x] 1.5 Export `GetCompletedDaysInWeek` and `getWeekBounds` from `src/domain/index.ts`

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/domain/entities/WorkoutSession.ts` | Modified | Added `getWeekBounds(date)` pure function — computes Monday 00:00 to Sunday 23:59:59 local time |
| `src/domain/repositories/IWorkoutSessionRepository.ts` | Modified | Added `getCompletedDaysInWeek(uid, routineId, weekStart, weekEnd): Promise<string[]>` |
| `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts` | Modified | Implemented `getCompletedDaysInWeek` with Firestore compound query + client-side fallback |
| `src/domain/usecases/workout/GetCompletedDaysInWeek.ts` | Created | Thin use-case wrapper delegating to repository |
| `src/domain/index.ts` | Modified | Exported `getWeekBounds` and `GetCompletedDaysInWeek` |

## Deviations from Design
None — implementation matches design.

## Issues Found
None.

## Remaining Tasks

### Phase 2: Navigation
- [ ] 2.1 Update `src/presentation/navigation/types.ts`: add `TrainStackParamList`, remove `WorkoutSession` from `RoutineStackParamList`
- [ ] 2.2 Create `src/presentation/navigation/TrainStack.tsx`
- [ ] 2.3 Add `Train` tab to `src/presentation/navigation/MainAppTabs.tsx`
- [ ] 2.4 Remove `WorkoutSession` route from `src/presentation/navigation/RoutineStack.tsx`
- [ ] 2.5 Remove start-workout button from `src/presentation/screens/routines/RoutineDetailScreen.tsx`

### Phase 3: Screens & Hook
- [ ] 3.1 Create `src/presentation/hooks/useCompletedDaysInWeek.ts`
- [ ] 3.2 Create `src/presentation/screens/train/TrainLobbyScreen.tsx`
- [ ] 3.3 Create `src/presentation/screens/train/DaySelectionScreen.tsx`
- [ ] 3.4 Update `src/presentation/screens/workout/WorkoutSessionScreen.tsx`
- [ ] 3.5 Add `markSessionComplete` to `src/presentation/context/WorkoutSessionContext.tsx`

### Phase 4: Verification
- [ ] 4.1 Verify `getWeekBounds` edge cases
- [ ] 4.2 Verify Firestore composite query returns correct day IDs
- [ ] 4.3 Smoke test: lobby → day selection → session → incomplete exit prompt
- [ ] 4.4 Verify checkmarks render on day tabs in both screens

### Phase 5: Cleanup
- [ ] 5.1 Remove dead code from `RoutineDetailScreen`
- [ ] 5.2 Document Firestore composite index requirement in README

## Workload / PR Boundary
- **Mode**: feature-branch-chain
- **Current work unit**: PR 1 — Foundation
- **Boundary**: Week bounds helper + repository query + use case; no UI changes
- **Estimated review budget impact**: ~70 changed lines; well under 400-line budget

## Status
5/5 Phase 1 tasks complete. 0/15 remaining tasks complete. Ready for PR 2 (Navigation).
