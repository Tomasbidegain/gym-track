# Workout Session Timer Specification

## Purpose

Session elapsed-time display. In-memory stopwatch anchored to `Date.now() - startedAt` for accuracy across app backgrounding and foreground transitions.

## Requirements

### Requirement: Session Stopwatch Display

The system SHALL display elapsed time for an active workout session, derived from `Date.now() - startedAt`. The display MUST update every second while the session is active.

#### Scenario: Timer increments on active session

- GIVEN an active workout session with `startedAt` set
- WHEN the session screen mounts
- THEN elapsed time displays as HH:MM:SS
- AND the display updates every second

#### Scenario: Timer resumes after app backgrounding

- GIVEN an active session with timer running
- WHEN the app returns from background to foreground
- THEN elapsed time equals `Date.now() - startedAt` (no accumulated drift)
- AND the display resumes accurate counting

### Requirement: Pre-Session Button Gate

The system MUST hide check buttons and timer controls until a workout session has started.

#### Scenario: Buttons hidden before session start

- GIVEN a routine is loaded but no session has started
- WHEN the workout session screen renders
- THEN check buttons and timer controls are hidden or disabled

#### Scenario: Buttons visible after session start

- GIVEN an active workout session
- WHEN the session screen renders
- THEN check buttons and timer controls are visible and interactive

### Requirement: Session Duration Persistence

The system SHALL compute and persist `totalDurationSeconds` on session completion, calculated as `(completedAt - startedAt) / 1000` rounded to the nearest integer.

#### Scenario: Duration recorded on session completion

- GIVEN an active session with `startedAt`
- WHEN the user completes the session
- THEN `totalDurationSeconds` is calculated from `completedAt - startedAt` (in seconds)
- AND `totalDurationSeconds` is persisted with the session document

#### Scenario: Duration not written during active session

- GIVEN an active session still in progress
- WHEN the session has not been completed
- THEN no `totalDurationSeconds` value is written to Firestore