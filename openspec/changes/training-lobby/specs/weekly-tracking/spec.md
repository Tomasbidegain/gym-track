# Weekly Tracking Specification

## Purpose

Derive per-routine weekly completion status from existing `workoutSessions`, enabling the day-selection UI to display checkmarks on completed days and prevent re-completion within the same week.

## Requirements

### Requirement: Week Boundary Calculation

The system SHALL compute weekly boundaries using local time: Monday 00:00:00 through Sunday 23:59:59.

- GIVEN any date reference
- WHEN `getWeekBounds` is called
- THEN it returns `{ weekStart: Monday 00:00:00 local, weekEnd: Sunday 23:59:59 local }`

#### Scenario: Midweek date

- GIVEN the reference date is Wednesday June 10 2026
- WHEN getWeekBounds is called
- THEN weekStart is Monday June 8 00:00:00 and weekEnd is Sunday June 14 23:59:59

#### Scenario: Sunday edge

- GIVEN the reference date is Sunday June 14 2026
- WHEN getWeekBounds is called
- THEN weekStart is Monday June 8 00:00:00 and weekEnd is Sunday June 14 23:59:59

### Requirement: Completed Days Query

The system SHALL provide `getCompletedDaysInWeek(uid, routineId, weekStart, weekEnd)` on `IWorkoutSessionRepository` returning day IDs of completed sessions within the week bounds.

- GIVEN a user has completed WorkoutSessions for "Day A" and "Day C" within the current week
- WHEN `getCompletedDaysInWeek` is called for that routine and week range
- THEN it returns `['dayA-id', 'dayC-id']`

#### Scenario: No completions in week

- GIVEN the user has no completed sessions this week for the routine
- WHEN getCompletedDaysInWeek is called
- THEN it returns an empty array

### Requirement: Per-Routine Tracking

Weekly tracking MUST be independent per routine. Each routine's completed days are tracked separately.

- GIVEN the user completed "Day 1" of Routine A and no days of Routine B
- WHEN viewing DaySelection for Routine A
- THEN "Day 1" shows a checkmark
- AND viewing DaySelection for Routine B shows no checkmarks

### Requirement: Completed Day Checkmark

The system SHALL display a checkmark icon on completed day tabs in `DaySelectionScreen`.

- GIVEN a day ID appears in `getCompletedDaysInWeek` results
- WHEN DaySelectionScreen renders day tabs
- THEN that day tab shows a checkmark indicator

### Requirement: Block Re-Completion

The system MUST prevent the user from starting a new workout session for a day already completed in the current week.

- GIVEN "Day A" is completed this week for the selected routine
- WHEN the user taps "Day A" in DaySelectionScreen
- THEN the system blocks navigation and shows feedback that the day is already completed

### Requirement: Week Reset

The system SHALL reset completion status at the start of each new week (Monday 00:00 local).

- GIVEN "Day A" was completed in the prior week
- WHEN the new week begins (Monday 00:00 local)
- THEN "Day A" no longer appears completed and CAN be started again