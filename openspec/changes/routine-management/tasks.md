# Tasks: Routine Management

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1500–1800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain+repo) → PR 2 (state+nav) → PR 3 (screens) → PR 4 (rules+tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Repository | PR 1 | Routine entity, use cases, Firestore repo; base = dev |
| 2 | State + Navigation | PR 2 | RoutineContext, useRoutines, ExercisePickerContext, nav wiring; base = dev |
| 3 | Screens | PR 3 | List, Detail, Create, Edit, Picker; base = PR 2 branch |
| 4 | Rules + Tests | PR 4 | firestore.rules, unit/integration tests; base = PR 3 branch |

## Phase 1: Domain & Repository

- [ ] 1.1 Create `src/domain/entities/Routine.ts` with Routine, RoutineExercise, validation, isOrphaned
- [ ] 1.2 Create `src/domain/errors/RoutineError.ts` with RoutineNotFoundError, DuplicateRoutineNameError
- [ ] 1.3 Create `src/domain/repositories/IRoutineRepository.ts`
- [ ] 1.4 Create use cases: GetRoutines, GetRoutineById, CreateRoutine, UpdateRoutine, DeleteRoutine, DuplicateRoutine
- [ ] 1.5 Create `src/data/firebase/firestore/FirestoreRoutineRepository.ts`

## Phase 2: State Management

- [ ] 2.1 Create `src/presentation/context/RoutineContext.tsx` with routines, loading, error, currentRoutine, refresh
- [ ] 2.2 Create `src/presentation/hooks/useRoutines.ts` consuming RoutineContext
- [x] 2.3 Create `src/presentation/context/ExercisePickerContext.tsx` with selection, toggle, clear

## Phase 3: Navigation

- [ ] 3.1 Modify `src/presentation/navigation/types.ts`: add RoutineStackParamList, add "Routines" to MainAppTabParamList
- [ ] 3.2 Modify `src/presentation/navigation/MainAppTabs.tsx`: add Routines tab with RoutineStack
- [ ] 3.3 Create `src/presentation/navigation/RoutineStack.tsx`

## Phase 4: Screens

- [x] 4.1 Create `RoutineListScreen.tsx`: list, empty state, sort by updatedAt, pull-to-refresh
- [x] 4.2 Create `RoutineDetailScreen.tsx`: show exercises, orphaned badges, duplicate action, delete with alert
- [x] 4.3 Create `RoutineCreateScreen.tsx`: name input, description, navigate to picker, save with validation
- [x] 4.4 Create `RoutineEditScreen.tsx`: pre-populate form, update, name uniqueness check
- [x] 4.5 Create `ExercisePickerScreen.tsx`: multi-select catalog, search/filter, pre-selected state, default params

## Phase 5: Wiring & Rules

- [ ] 5.1 Modify `src/domain/index.ts`: export new entities, errors, use cases, repository
- [ ] 5.2 Modify `firestore.rules`: add `users/{uid}/routines/{routineId}` read/write rule
- [ ] 5.3 Wire RoutineContext into `App.tsx` above RootNavigator

## Phase 6: Testing

- [ ] 6.1 Unit test Routine entity validation (name required, unique, ≥1 exercise)
- [ ] 6.2 Unit test CreateRoutine, UpdateRoutine, DuplicateRoutine use cases with stub repo
- [ ] 6.3 Unit test `isOrphaned` with catalog match/mismatch
- [ ] 6.4 Integration test FirestoreRoutineRepository CRUD + duplicate with Firebase emulator
