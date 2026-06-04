# App Navigation Specification

## Purpose

Navigation hierarchy that gates all features behind authentication. Auth state determines initial route. Post-auth, bottom tabs organize main features.

## Requirements

### REQ-AN-01: Auth Gate

The system SHALL determine the initial route based on authentication state before rendering any screen.

- GIVEN app launches with no cached session
- WHEN auth state resolves as unauthenticated
- THEN system navigates to Login screen

- GIVEN app launches with a cached session
- WHEN auth state resolves as authenticated
- THEN system navigates to MainApp (Exercises tab)

- GIVEN auth state is being determined (initializing)
- WHEN app renders
- THEN system shows a loading/splash placeholder (not Login or MainApp)

### REQ-AN-02: Auth Stack

The system SHALL provide a stack navigator for authentication screens.

| Screen | Purpose |
|--------|---------|
| Login | Email/password sign-in |
| Register | Email/password registration |

- GIVEN user is on Login screen
- WHEN user taps "Register" link
- THEN system navigates to Register screen

- GIVEN user is on Register screen
- WHEN user taps "Login" link
- THEN system navigates to Login screen

- GIVEN user auth state changes to authenticated
- WHEN transitioning from auth stack
- THEN system navigates to MainApp and auth stack MUST NOT be accessible

### REQ-AN-03: Main App Tabs

The system SHALL provide a bottom tab navigator for authenticated users.

| Tab | Content |
|-----|---------|
| Exercises | Exercise list, filters, detail, create, edit |
| Profile | User info, sign-out action |

- GIVEN user is authenticated
- WHEN MainApp renders
- THEN Exercises tab is the default active tab

- GIVEN user taps Profile tab
- WHEN profile screen renders
- THEN system displays user email and sign-out button

### REQ-AN-04: Exercise Stack

The Exercises tab SHALL contain a stack navigator.

| Screen | Trigger |
|--------|---------|
| ExerciseList | Default tab screen |
| ExerciseDetail | Tap exercise in list |
| ExerciseCreate | "Add exercise" action |
| ExerciseEdit | Tap edit on custom exercise detail |

- GIVEN user is on ExerciseList
- WHEN user taps an exercise
- THEN system pushes ExerciseDetail onto the stack

- GIVEN user is on ExerciseList
- WHEN user taps "Add exercise"
- THEN system pushes ExerciseCreate onto the stack

- GIVEN user is on ExerciseDetail for a custom exercise
- WHEN user taps "Edit"
- THEN system pushes ExerciseEdit onto the stack

- GIVEN user is on ExerciseDetail for a seeded exercise
- WHEN screen renders
- THEN edit action MUST NOT be visible

### REQ-AN-05: Sign-Out Navigation

- GIVEN user taps sign-out on Profile
- WHEN sign-out completes
- THEN system navigates back to auth stack (Login screen)
- AND clears MainApp from navigation state

### NFR-AN-01: Navigation Performance

- GIVEN auth state resolves
- WHEN initial route is determined
- THEN navigation transition SHALL complete within 500ms

### NFR-AN-02: Back Button Behavior

- GIVEN user is on ExerciseDetail, ExerciseCreate, or ExerciseEdit
- WHEN hardware back button or back gesture fires
- THEN system pops to previous screen in exercise stack

- GIVEN user is on ExerciseList (root of exercise stack)
- WHEN hardware back button fires
- THEN system MUST NOT navigate back to auth screens