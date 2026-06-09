# Incomplete Session Handling Specification

## Purpose

Handle user exit from an incomplete workout session by prompting whether to mark it complete or resume later.

## Requirements

### Requirement: Exit Prompt on Incomplete Session

When the user exits a `WorkoutSessionScreen` where `isCompleted === false`, the system SHALL display a prompt with the message: "Day X is incomplete. Mark as completed or resume another day?"

- GIVEN an active workout session with `isCompleted === false`
- WHEN the user attempts to exit (back navigation or gesture)
- THEN a prompt appears with the day name substituted for X

#### Scenario: User marks as completed

- GIVEN the incomplete-session prompt is displayed
- WHEN the user selects "Mark as completed"
- THEN the system calls `completeWorkoutSession`, sets `isCompleted = true` and `completedAt` to now, and navigates back

#### Scenario: User chooses to resume later

- GIVEN the incomplete-session prompt is displayed
- WHEN the user selects "Resume another day"
- THEN the session is left as `isCompleted === false` and the system navigates back to DaySelectionScreen

### Requirement: Complete Exit Allowed

The system MUST NOT display the prompt if the session is already completed (`isCompleted === true`).

- GIVEN an active workout session with `isCompleted === true`
- WHEN the user exits the session
- THEN the system navigates back without a prompt

### Requirement: Checkmark Visibility During Workout

The system SHALL show checkmarks on day tabs within the active workout session screen, consistent with DaySelectionScreen checkmark rendering.

- GIVEN the user is on WorkoutSessionScreen
- WHEN day tabs are rendered
- THEN completed days display a checkmark indicator identical to DaySelectionScreen