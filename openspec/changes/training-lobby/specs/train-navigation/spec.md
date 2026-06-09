# Train Navigation Specification

## Purpose

Manage the navigation flow from the Train bottom tab through routine selection (lobby), day selection, and into an active workout session.

## Requirements

### Requirement: Train Tab Availability

The system SHALL display a "Train" bottom tab in the main tab navigator.

- GIVEN the app is running
- WHEN the user views the bottom navigation
- THEN a "Train" tab icon is visible alongside existing tabs

### Requirement: Train Stack Routes

The system SHALL provide a `TrainStack` with three routes: `TrainLobby`, `DaySelection`, and `WorkoutSession`.

- GIVEN the user taps the Train tab
- WHEN the TrainStack renders
- THEN the stack MUST contain exactly `TrainLobby`, `DaySelection`, and `WorkoutSession` routes

### Requirement: Routine Lobby

The system SHALL display all user routines on `TrainLobbyScreen`.

- GIVEN the user has two or more routines
- WHEN the Train tab is active
- THEN TrainLobbyScreen shows each routine as a selectable card

### Requirement: Auto-Skip Lobby

The system MUST navigate directly to `DaySelection` when the user has exactly one routine.

- GIVEN the user has exactly one routine
- WHEN the Train tab becomes active
- THEN the lobby screen is bypassed and DaySelectionScreen renders with that routine's days

### Requirement: Day Selection Flow

The system SHALL navigate from lobby selection to `DaySelectionScreen` passing the `routineId`.

- GIVEN the user selects a routine on the lobby
- WHEN the tap completes
- THEN DaySelectionScreen renders showing all days of that routine

### Requirement: Workout Session Launch

The system SHALL navigate from day selection to `WorkoutSessionScreen` passing `routineId` and `dayId`.

- GIVEN the user selects an incomplete day
- WHEN the tap completes
- THEN WorkoutSessionScreen initializes a new WorkoutSession for that routine's day

### Requirement: WorkoutSession Relocated

The system MUST remove `WorkoutSession` from `RoutineStackParamList` and add it to `TrainStackParamList`. The WorkoutSessionScreen SHALL accept navigation props from the Train stack only.

- GIVEN WorkoutSessionScreen is rendered
- WHEN the screen reads its route params
- THEN it receives `routineId` and `dayId` from the Train stack

### Requirement: Remove Start Button from Routine Detail

The system MUST NOT display a start-workout button on `RoutineDetailScreen`.

- GIVEN the user views a routine's detail screen
- WHEN the screen renders
- THEN no "Start Workout" action is available