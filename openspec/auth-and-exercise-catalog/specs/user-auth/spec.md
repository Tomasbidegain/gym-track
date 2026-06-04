# User Auth Specification

## Purpose

Mandatory email/password authentication via Firebase Auth. All app features are gated behind authentication — no anonymous access. Each user's data is isolated per-UID in Firestore.

## Requirements

### REQ-UA-01: Email/Password Registration

The system SHALL register new users with email, password, and password confirmation.

| Field | Rule |
|-------|------|
| Email | MUST be valid format, MUST NOT be empty |
| Password | MUST be ≥ 6 characters |
| Confirm Password | MUST match password |

- GIVEN no authenticated session exists
- WHEN user submits valid email + password + matching confirmation
- THEN system creates account via Firebase Auth and navigates to MainApp

- GIVEN no authenticated session exists
- WHEN user submits mismatched passwords
- THEN system rejects with "Passwords do not match"

- GIVEN no authenticated session exists
- WHEN user submits email already registered
- THEN system rejects with "Email already in use"

### REQ-UA-02: Email/Password Login

The system SHALL authenticate existing users with email and password.

- GIVEN no authenticated session exists
- WHEN user submits correct email + password
- THEN system signs in via Firebase Auth and navigates to MainApp

- GIVEN no authenticated session exists
- WHEN user submits wrong password
- THEN system rejects with "Invalid credentials"

- GIVEN no authenticated session exists
- WHEN user submits unregistered email
- THEN system rejects with "Invalid credentials"

- GIVEN login screen is displayed
- WHEN user taps the register link
- THEN system shows registration screen

### REQ-UA-03: Session Persistence

The system SHALL persist authentication state across app restarts using Firebase `onAuthStateChanged`.

- GIVEN user previously signed in and closed app
- WHEN app reopens
- THEN system detects existing session and navigates directly to MainApp

- GIVEN user previously signed out
- WHEN app reopens
- THEN system shows Login screen

### REQ-UA-04: Sign-Out

The system SHALL allow authenticated users to sign out.

- GIVEN user is authenticated
- WHEN user triggers sign-out
- THEN system calls Firebase signOut, clears session, and navigates to Login

- GIVEN sign-out is in progress
- WHEN UI renders
- THEN system shows loading indicator and disables interaction

### REQ-UA-05: Auth State and Loading

The system MUST expose auth state (user object or null) and loading flag synchronously via context.

- GIVEN app is initializing
- WHEN auth state is being determined
- THEN system shows splash/loading (not Login/MainApp)

- GIVEN auth state resolves
- WHEN there is an active user
- THEN system navigates to MainApp

- GIVEN auth state resolves
- WHEN there is no active user
- THEN system navigates to Login

### REQ-UA-06: No Anonymous Auth

The system MUST NOT allow anonymous sign-in. All data access requires an authenticated UID.

- GIVEN app is open
- WHEN no authenticated session exists
- THEN system shows auth screens only; no app features are accessible

### NFR-UA-01: Offline Auth Resilience

- GIVEN device has no network
- WHEN user opens app with existing session
- THEN system uses cached auth token to allow access

### NFR-UA-02: Auth Error Clarity

- GIVEN an auth operation fails
- WHEN error is displayed
- THEN user-facing message SHALL be human-readable (no raw Firebase codes)