# Time-Based Exercises Specification

## Purpose

Extends routine definitions to support duration-based exercises (planks, wall sits) alongside rep-based exercises. Adds `isTimeBased` flag and `targetDurationSeconds` to `RoutineExercise`, plus `durationSeconds` to `WorkoutSet`.

## Requirements

### Requirement: Time-Based Exercise Definition

`RoutineExercise` SHALL include `isTimeBased` (boolean, default `false`) and `targetDurationSeconds` (number, default `0`).

#### Scenario: Create time-based exercise in routine editor

- GIVEN a routine editor screen
- WHEN the user toggles an exercise to time-based and enters a target duration in seconds
- THEN `isTimeBased` is set to `true` and `targetDurationSeconds` stores the entered value
- AND the exercise retains all other fields unchanged

#### Scenario: Rep-based exercise remains unchanged

- GIVEN an existing rep-based exercise with `isTimeBased` omitted or `false`
- WHEN the exercise is loaded
- THEN behavior is identical to pre-feature (backward compatible)

### Requirement: Time-Based Validation

When `isTimeBased` is `true`, `targetDurationSeconds` MUST be greater than 0. `targetReps` MAY be 0 for time-based exercises.

#### Scenario: Reject zero or negative duration

- GIVEN a routine exercise with `isTimeBased: true`
- WHEN `targetDurationSeconds` is 0 or negative
- THEN validation fails with an error indicating duration must be positive

#### Scenario: Allow zero reps for time-based

- GIVEN a routine exercise with `isTimeBased: true`
- WHEN `targetReps` is 0
- THEN validation passes (reps optional for time-based exercises)

### Requirement: Time-Based Set Generation

`generateSetsFromRoutine` SHALL seed time-based sets with `durationSeconds: 0` and `reps: 0`.

#### Scenario: Generate sets for time-based exercise

- GIVEN a routine exercise with `isTimeBased: true` and `targetDurationSeconds: 60`
- WHEN workout sets are generated
- THEN each set has `durationSeconds: 0` and `reps: 0`

### Requirement: Volume Exclusion for Time-Based Sets

`calculateTotalVolume` MUST NOT include time-based sets. Only rep-based sets contribute to `totalVolume`.

#### Scenario: Volume calculation skips time-based sets

- GIVEN a workout session with both rep-based and time-based exercises
- WHEN total volume is calculated
- THEN only rep-based sets contribute to `totalVolume`
- AND time-based sets are excluded from the sum

### Requirement: Duration Display Format

The system SHALL display time-based exercises as "N sets × Xs" instead of the rep-based "N sets × Y reps" format.

#### Scenario: Duration format in routine detail

- GIVEN a routine exercise with `isTimeBased: true`, `targetDurationSeconds: 45`, `targetSets: 3`
- WHEN the routine detail screen renders
- THEN the exercise displays "3 sets × 45s"

### Requirement: Backward Compatibility at Read Boundaries

Firestore documents missing `isTimeBased` or `targetDurationSeconds` SHALL default to `isTimeBased: false` and `targetDurationSeconds: 0` at repository read boundaries. `WorkoutSet` missing `durationSeconds` SHALL default to `0`.

#### Scenario: Old Firestore document defaults

- GIVEN a Firestore routineExercise document missing `isTimeBased` and `targetDurationSeconds`
- WHEN the repository reads this document
- THEN `isTimeBased` defaults to `false` and `targetDurationSeconds` defaults to `0`