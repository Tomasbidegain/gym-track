# Apply Progress: Training Lobby

## Mode
Standard (no test runner available; strict_tdd: false)

## Delivery Strategy
- **Mode**: force-chained PR
- **Chain strategy**: feature-branch-chain
- **Target branch**: dev
- **Current slice**: PR 2 of 3 (Navigation & lobby)
- **Workload decision**: Resolved by orchestrator — force-chained, feature-branch-chain

## Completed Tasks

### Phase 1: Foundation
- [x] 1.1 Add `getWeekBounds(date)` to `src/domain/entities/WorkoutSession.ts`
- [x] 1.2 Add `getCompletedDaysInWeek` to `src/domain/repositories/IWorkoutSessionRepository.ts`
- [x] 1.3 Implement `getCompletedDaysInWeek` in `src/data/firebase/firestore/FirestoreWorkoutSessionRepository.ts`
- [x] 1.4 Create `src/domain/usecases/workout/GetCompletedDaysInWeek.ts`
- [x] 1.5 Export `GetCompletedDaysInWeek` and `getWeekBounds` from `src/domain/index.ts`

### Phase 2: Navigation
- [x] 2.1 Update `src/presentation/navigation/types.ts`: add `TrainStackParamList`, remove `WorkoutSession` from `RoutineStackParamList`
- [x] 2.2 Create `src/presentation/navigation/TrainStack.tsx`
- [x] 2.3 Add `Train` tab to `src/presentation/navigation/MainAppTabs.tsx`
- [x] 2.4 Remove `WorkoutSession` route from `src/presentation/navigation/RoutineStack.tsx`
- [x] 2.5 Remove start-workout button from `src/presentation/screens/routines/RoutineDetailScreen.tsx`

### Phase 3: Screens & Hook
- [x] 3.2 Create `src/presentation/screens/train/TrainLobbyScreen.tsx` (routine cards, auto-skip when 1 routine)
- [ ] 3.1 Create `src/presentation/hooks/useCompletedDaysInWeek.ts`
- [ ] 3.3 Create `src/presentation/screens/train/DaySelectionScreen.tsx` (checkmarks, block completed days)
- [ ] 3.4 Update `src/presentation/screens/workout/WorkoutSessionScreen.tsx` (Train props, `beforeRemove` prompt, day checkmarks)
- [ ] 3.5 Add `markSessionComplete` to `src/presentation/context/WorkoutSessionContext.tsx`

### Phase 4: Verification
- [ ] 4.1 Verify `getWeekBounds` edge cases (Sunday, Monday, timezone)
- [ ] 4.2 Verify Firestore composite query returns correct day IDs
- [ ] 4.3 Smoke test: lobby -> day selection -> session -> incomplete exit prompt
- [ ] 4.4 Verify checkmarks render on day tabs in both screens

### Phase 5: Cleanup
- [ ] 5.1 Remove dead code from `src/presentation/screens/routines/RoutineDetailScreen.tsx`
- [ ] 5.2 Document Firestore composite index requirement in README

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/presentation/navigation/types.ts` | Modified | Added `TrainStackParamList` with `TrainLobby`, `DaySelection`, `WorkoutSession`; removed `WorkoutSession` from `RoutineStackParamList`; added `Train` to `MainAppTabParamList`; added `TrainScreenProps` |
| `src/presentation/navigation/TrainStack.tsx` | Created | New stack navigator with TrainLobby, DaySelection, and WorkoutSession screens |
| `src/presentation/navigation/MainAppTabs.tsx` | Modified | Added `Train` tab pointing to `TrainStack` between `Routines` and `Profile` |
| `src/presentation/navigation/RoutineStack.tsx` | Modified | Removed `WorkoutSession` import and route registration |
| `src/presentation/screens/routines/RoutineDetailScreen.tsx` | Modified | Removed start-workout button and debug Alert navigation to `WorkoutSession` |
| `src/presentation/screens/train/TrainLobbyScreen.tsx` | Created | Routine cards with auto-skip to `DaySelection` when exactly one routine exists |
| `src/presentation/screens/train/DaySelectionScreen.tsx` | Created | Minimal day selection screen listing routine days and navigating to `WorkoutSession` (full checkmarks/blocking in PR 3) |
| `src/presentation/screens/workout/WorkoutSessionScreen.tsx` | Modified | Updated to accept `TrainScreenProps<'WorkoutSession'>`; changed `dayIndex` param to `dayId` with day lookup by id |

## Deviations from Design
- **WorkoutSessionScreen updated in PR 2**: The design places the full `WorkoutSessionScreen` update (Train props, `beforeRemove` prompt, day checkmarks) in task 3.4 (PR 3). However, removing `WorkoutSession` from `RoutineStackParamList` in PR 2 would break TypeScript compilation because `WorkoutSessionScreen` imported `RoutineScreenProps<'WorkoutSession'>`. To keep the build passing, the minimal prop migration (`RoutineScreenProps` -> `TrainScreenProps`, `dayIndex` -> `dayId`) was applied in PR 2. The remaining features (`beforeRemove` prompt, day checkmarks) are still pending in PR 3.
- **DaySelectionScreen created in PR 2**: The design places the full `DaySelectionScreen` (with checkmarks and blocking) in task 3.3 (PR 3). Because `TrainStack` must register all three routes per the spec, a minimal `DaySelectionScreen` was created in PR 2 that lists days and navigates to `WorkoutSession`. Checkmarks and blocking logic will be added in PR 3.

## Issues Found
None.

## Remaining Tasks

### Phase 3: Screens & Hook
- [ ] 3.1 Create `src/presentation/hooks/useCompletedDaysInWeek.ts`
- [ ] 3.3 Enhance `src/presentation/screens/train/DaySelectionScreen.tsx` with checkmarks and block completed days
- [ ] 3.4 Update `src/presentation/screens/workout/WorkoutSessionScreen.tsx` with `beforeRemove` prompt and day checkmarks
- [ ] 3.5 Add `markSessionComplete` to `src/presentation/context/WorkoutSessionContext.tsx`

### Phase 4: Verification
- [ ] 4.1 Verify `getWeekBounds` edge cases (Sunday, Monday, timezone)
- [ ] 4.2 Verify Firestore composite query returns correct day IDs
- [ ] 4.3 Smoke test: lobby -> day selection -> session -> incomplete exit prompt
- [ ] 4.4 Verify checkmarks render on day tabs in both screens

### Phase 5: Cleanup
- [ ] 5.1 Remove dead code from `RoutineDetailScreen`
- [ ] 5.2 Document Firestore composite index requirement in README

## Workload / PR Boundary
- **Mode**: feature-branch-chain
- **Current work unit**: PR 2 — Navigation & lobby
- **Boundary**: Train stack + types + lobby screen + minimal day selection + minimal workout session prop migration
- **Estimated review budget impact**: ~250 changed lines; well under 400-line budget

## Status
10/20 tasks complete. Ready for PR 3 (Day/session integration).
