# Proposal: Routine Management

## Intent

Enable users to create, view, edit, delete, and duplicate reusable workout templates (routines) composed of exercises from the catalog. This is the foundation before workout session tracking and progress history.

## Scope

### In Scope
- Full CRUD + duplicate routines
- 5 screens: List, Detail, Create, Edit, Exercise Picker (modal)
- RoutineExercise with hybrid snapshot + reference model (`exerciseId` + `name`, `muscleGroup`, `equipment`)
- Firestore embedded array: `users/{uid}/routines/{routineId}` (single doc, no subcollection)
- New "Routines" tab in bottom navigation
- Up/down buttons for exercise reorder (drag-and-drop deferred)
- Orphaned exercise handling (deleted catalog entry → muted badge)
- Duplicate name validation (case-insensitive, client-side)
- Firestore security rules update

### Out of Scope
- Workout sessions / active workout tracking
- Progress history, stats, charts
- Google Sign-In
- Exercise catalog improvements
- Routine versioning / audit trail
- Supersets, circuits, grouped exercises
- Sharing routines between users
- Drag-and-drop reorder (`react-native-draggable-flatlist` deferred)

## Capabilities

### New Capabilities
- `routine-management`: Create, list, view detail, edit, delete, and duplicate workout routines with embedded RoutineExercise arrays. Validates name uniqueness, minimum 1 exercise, sets ≥ 1, rest ≥ 0.
- `routine-exercise-selection`: Multi-select modal picker from exercise catalog with search/filter. Configure sets, reps (free-text), rest seconds, notes, and display order per selected exercise.

### Modified Capabilities
None — existing exercise and auth specs are unchanged.

## Approach

Mirror the existing exercises feature pattern: Domain entities → use cases → `IRoutineRepository` → `FirestoreRoutineRepository` → `useRoutines` hook → screens.

Routine stored as single Firestore document with embedded `exercises` array (bounded <20 exercises, well within 1MB limit). Atomic reads/writes; no subcollection overhead.

ExercisePickerScreen uses a temporary React Context or event emitter to bypass React Navigation v6 callback serialization limits. "Done" returns selected exercises to the create/edit screen via that shared state.

Navigation: add third tab "Routines" to `MainAppTabs`, with `RoutineStack` (NativeStackNavigator) hosting all 5 screens.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/entities/Routine.ts` | New | Routine + RoutineExercise + validation types |
| `src/domain/repositories/IRoutineRepository.ts` | New | Repository interface |
| `src/domain/usecases/routine/` | New | 6 use cases |
| `src/data/firebase/firestore/FirestoreRoutineRepository.ts` | New | Firestore implementation |
| `src/presentation/hooks/useRoutines.ts` | New | Hook with local state + optimistic updates |
| `src/presentation/screens/routines/` | New | 5 screen components |
| `src/presentation/navigation/` | Modified | New tab, RoutineStack, param types |
| `firestore.rules` | Modified | Add `users/{uid}/routines/{routineId}` rule |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Picker callback not serializable in nav params | Medium | Temporary picker context or emitter pattern instead of route params callback |
| Snapshot drift from exercise catalog | Low | Show "Ejercicio eliminado" badge on orphaned refs; manual refresh in edit mode (future) |
| Routine name collision (client-side only) | Low | Case-insensitive check against local state at create/edit; acceptable for MVP |
| Reorder UX without drag-and-drop | Low | Up/down arrow buttons; `react-native-draggable-flatlist` deferred |

## Rollback Plan

1. Remove "Routines" tab from `MainAppTabs` (revert to 2-tab layout).
2. Delete routine-specific files: `src/presentation/screens/routines/`, `useRoutines.ts`, `FirestoreRoutineRepository.ts`, use cases, entities, repository interface.
3. Revert `firestore.rules` and navigation type changes.
4. No data migration needed — orphaned Firestore routines can be cleaned up via Firebase console if desired.

## Dependencies

None — no new npm packages required for MVP.

## Success Criteria

- [ ] User can create a routine with name, description, and ≥1 exercise
- [ ] User can view routine list; tap to see detail with all exercises and configured params
- [ ] User can edit routine (name, exercises, params) and save
- [ ] User can delete a routine after confirmation alert
- [ ] User can duplicate a routine from detail view
- [ ] Orphaned exercises show "Ejercicio eliminado" badge with disabled action
- [ ] "Routines" tab appears between Exercises and Profile
- [ ] All CRUD operations work offline via Firestore persistence
