# Proposal: Training Lobby

## Intent

Separate routine CRUD from training. Currently RoutineDetailScreen conflates template editing with starting a workout. Add a dedicated "Train" tab with lobby → day selection → workout session flow, enabling weekly completion tracking to prevent overtraining.

## Scope

### In Scope
- New "Train" bottom tab with `TrainStack` (TrainLobbyScreen, DaySelectionScreen)
- Move `WorkoutSessionScreen` from RoutineStack to TrainStack
- Remove "Iniciar entrenamiento" button from RoutineDetailScreen
- Weekly completion tracking (Monday–Sunday local time) derived from existing `workoutSessions`
- Auto-skip lobby when user has 1 routine
- Completed-day checkmarks + blocking in DaySelectionScreen
- Incomplete-session exit prompt: "Day X is incomplete. Mark as completed or resume another day?"

### Out of Scope
- New `trainingWeek` collection (derive from sessions)
- User-configurable week start day
- Rest-day scheduling or planned/skipped tracking
- Lobby-level per-routine completion badges

## Capabilities

### New Capabilities
- `train-navigation`: Lobby flow — routine pick → day select → workout session via TrainStack
- `weekly-tracking`: Derive completed day IDs from workoutSessions filtered by week range
- `incomplete-session-handling`: Prompt on exit for sessions with `isCompleted === false`

### Modified Capabilities
None — no existing specs.

## Approach

Derive weekly completion from `workoutSessions` (no new collection). Add `getCompletedDaysInWeek(uid, routineId, weekStart, weekEnd)` to repository interface, querying `isCompleted === true` + `completedAt` within bounds. Add `getWeekBounds(date)` domain helper (Monday 00:00 → Sunday 23:59:59 local). TrainLobbyScreen conditionally auto-navigates. DaySelectionScreen renders day tabs with checkmark on completed days and blocks re-tap. WorkoutSessionScreen is reused; update type coupling from `RoutineScreenProps` to `TrainScreenProps<'WorkoutSession'>`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `navigation/types.ts` | Modified | Add `TrainStackParamList`; remove `WorkoutSession` from `RoutineStackParamList`; update `MainAppTabParamList` |
| `navigation/MainAppTabs.tsx` | Modified | Add Train tab |
| `navigation/TrainStack.tsx` | New | Lobby → DaySelection → WorkoutSession stack |
| `navigation/RoutineStack.tsx` | Modified | Remove WorkoutSession route |
| `screens/train/` | New | TrainLobbyScreen, DaySelectionScreen |
| `screens/routines/RoutineDetailScreen.tsx` | Modified | Remove start-workout button + navigation call |
| `screens/workout/WorkoutSessionScreen.tsx` | Modified | Update screen props type |
| `domain/repositories/IWorkoutSessionRepository.ts` | Modified | Add `getCompletedDaysInWeek` |
| `data/.../FirestoreWorkoutSessionRepository.ts` | Modified | Implement week-range query |
| `domain/entities/WorkoutSession.ts` | Modified | Add `getWeekBounds` helper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Firestore composite index needed for multi-`where` | Low | Create index in dev; fallback to client-side filter |
| WorkoutSessionScreen type coupling | Low | Composite type or shared param list |
| UX break removing start button from RoutineDetail | Low | Train tab is the new CTA |
| Timezone edge cases | Low | Doc Monday-based local time; configurable later |

## Rollback Plan

Revert navigation changes: remove Train tab, restore WorkoutSession to RoutineStack, re-add start button to RoutineDetailScreen. No data migration needed — weekly tracking is derived, no new collections.

## Dependencies

None — uses existing `workoutSessions`, `RoutineContext`, `useRoutines`.

## Success Criteria

- [ ] Train tab navigates lobby → day selection → workout session
- [ ] RoutineDetailScreen has no start-workout button
- [ ] Completed days show checkmark and are blocked in DaySelectionScreen
- [ ] Single-routine users skip lobby directly to day selection
- [ ] Week resets Monday 00:00 local time
- [ ] Incomplete session exit prompts user with options
- [ ] All existing workout functionality (set tracking, rest timer, completion) works identically
