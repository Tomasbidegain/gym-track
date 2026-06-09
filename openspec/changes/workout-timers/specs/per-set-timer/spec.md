# Per-Set Timer Specification

## Purpose

Inline start/stop count-up timer per set row for time-based exercises. Records `durationSeconds` on stop and triggers rest timer via the existing completion flow.

## Requirements

### Requirement: Per-Set Timer UI

Each time-based set row SHALL display a start/stop button that controls a count-up timer. Tapping start begins counting from 00:00; tapping stop records elapsed duration, marks the set complete, and triggers the rest timer.

#### Scenario: Start timer for a set

- GIVEN an active workout session and a time-based set not yet started
- WHEN the user taps the start button
- THEN a count-up timer begins from 00:00
- AND the start button changes to a stop button

#### Scenario: Stop timer and record duration

- GIVEN a time-based set with an active count-up timer at 47 seconds
- WHEN the user taps the stop button
- THEN `durationSeconds` is recorded as 47 (rounded)
- AND the set is marked as completed
- AND the rest timer is triggered via the existing `onComplete` flow

### Requirement: Timer Pause on App Background

The per-set timer SHALL pause when the app enters background state and resume when returning to foreground.

#### Scenario: Timer pauses on backgrounding

- GIVEN an active per-set timer running
- WHEN `AppState` changes to background
- THEN the timer pauses (no elapsed time accumulates)
- AND the last displayed time is preserved

#### Scenario: Timer resumes on foreground

- GIVEN a paused per-set timer with last displayed time of 32 seconds
- WHEN `AppState` returns to active
- THEN the timer resumes counting from 32 seconds (not from zero)

### Requirement: Single Active Timer Constraint

Only one per-set timer SHALL be active at a time. Starting a new timer MUST stop any previously active timer.

#### Scenario: Starting timer stops previous active timer

- GIVEN set A has an active per-set timer
- WHEN the user starts timer for set B
- THEN set A's timer stops
- AND set A's `durationSeconds` is recorded if elapsed time > 0
- AND set B's timer starts counting from 00:00

#### Scenario: Completing last set stops timer

- GIVEN the last remaining time-based set has an active timer
- WHEN user stops the timer
- THEN the set is marked completed with recorded duration
- AND no other per-set timer becomes active

### Requirement: Duration in WorkoutSet

`WorkoutSet` SHALL include `durationSeconds` (number, default `0`). Rep-based sets always have `durationSeconds: 0`. `updateWorkoutSet` SHALL accept an optional `durationSeconds` parameter.

#### Scenario: Rep-based sets have zero duration

- GIVEN a rep-based workout set
- WHEN the set is created via `generateSetsFromRoutine`
- THEN `durationSeconds` is `0`