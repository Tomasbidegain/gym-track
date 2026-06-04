# Routine Management Specification

## Purpose

User-created workout templates (routines) composed of exercises from the catalog with configurable sets, reps, rest, and order. Full CRUD plus duplicate, with hybrid snapshot+reference model for resilience against catalog mutations.

## Requirements

### REQ-RM-01: Routine Entity

A routine SHALL have the following fields:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | string | Auto-gen | UUID |
| name | string | Yes | Unique per user (case-insensitive); 1–100 chars |
| description | string | No | Max 500 chars |
| exercises | RoutineExercise[] | Yes | ≥ 1 item |
| createdAt | timestamp | Auto | Server timestamp |
| updatedAt | timestamp | Auto | Server timestamp on every write |

### REQ-RM-02: RoutineExercise Value Object

Each RoutineExercise within a routine SHALL contain:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| exerciseId | string | Yes | References catalog exercise; may be orphaned |
| name | string | Yes | Snapshot from catalog at time of addition |
| muscleGroup | MuscleGroup | Yes | Snapshot from catalog |
| equipment | Equipment | Yes | Snapshot from catalog |
| sets | number | Yes | ≥ 1 |
| reps | string | Yes | Free-text (e.g. "8-12", "5", "AMRAP") |
| restSeconds | number | Yes | ≥ 0 |
| orderIndex | number | Yes | 0-based, unique within routine |
| notes | string | No | Optional per-exercise notes |

- GIVEN an exercise is added to a routine
- WHEN the exercise data is snapshotted
- THEN name, muscleGroup, and equipment are copied from the catalog entry at that moment

- GIVEN a catalog exercise is deleted after being added to a routine
- WHEN the routine is viewed
- THEN the routine SHALL still render using snapshot data
- AND the UI SHALL display a "Ejercicio eliminado" badge on that exercise card
- AND the "Ver ejercicio" action SHALL be disabled for that entry

### REQ-RM-03: Routine List

The system SHALL display all user routines in a list sorted by `updatedAt` descending.

- GIVEN user has one or more routines
- WHEN viewing the Routines tab
- THEN system displays each routine's name and exercise count

- GIVEN user has no routines
- WHEN viewing the Routines tab
- THEN system displays an empty state with a prompt to create one

### REQ-RM-04: Create Routine

The system SHALL allow authenticated users to create a routine.

- GIVEN user taps the create action on RoutineList
- WHEN RoutineCreateScreen opens
- THEN system shows name input (required) and optional description

- GIVEN user fills in name and at least one exercise
- WHEN user taps "Save"
- THEN system validates: name required, name unique per user (case-insensitive), ≥ 1 exercise, sets ≥ 1, restSeconds ≥ 0 per exercise
- AND system persists the routine to Firestore under `users/{uid}/routines/{id}`
- AND system navigates back to RoutineList with the new routine visible

- GIVEN user submits a name that matches an existing routine (case-insensitive)
- WHEN validation runs
- THEN system SHALL reject with "Ya existe una rutina con ese nombre"

- GIVEN user submits with 0 exercises
- WHEN validation runs
- THEN system rejects with "Agregá al menos un ejercicio"

- GIVEN user submits with empty name
- WHEN validation runs
- THEN system rejects with "El nombre es obligatorio"

### REQ-RM-05: Routine Detail View

The system SHALL display full routine details on tap.

- GIVEN user taps a routine in the list
- WHEN RoutineDetailScreen opens
- THEN system displays name, description, and an ordered list of exercise cards (sets × reps, rest, notes)

- GIVEN a routine contains an orphaned exercise (exerciseId not in catalog)
- WHEN RoutineDetailScreen renders that exercise card
- THEN system shows "Ejercicio eliminado" badge and disables navigation to that exercise

### REQ-RM-06: Edit Routine

The system SHALL allow users to edit routines they created.

- GIVEN user taps "Edit" on RoutineDetail
- WHEN RoutineEditScreen opens
- THEN system pre-populates all fields from existing routine data

- GIVEN user modifies routine data and taps "Save"
- WHEN validation passes
- THEN system updates the routine document with a new `updatedAt` timestamp
- AND system navigates back to RoutineDetailScreen with updated data

- GIVEN user modifies the routine name to match another existing routine (case-insensitive)
- WHEN validation runs
- THEN system rejects with "Ya existe una rutina con ese nombre"

### REQ-RM-07: Delete Routine

The system SHALL allow users to delete a routine after confirmation.

- GIVEN user taps "Delete" on RoutineDetail or RoutineList
- WHEN confirmation alert appears
- THEN user MUST confirm before deletion proceeds

- GIVEN user confirms deletion
- WHEN system processes the request
- THEN system deletes the routine document from Firestore
- AND system navigates back to RoutineList (or updates the list)

- GIVEN user cancels the confirmation alert
- WHEN dismissal occurs
- THEN system SHALL NOT delete the routine

### REQ-RM-08: Duplicate Routine

The system SHALL allow users to duplicate a routine from the detail view.

- GIVEN user taps "Duplicate" on RoutineDetail
- WHEN system processes duplication
- THEN system creates a new routine with name `${originalName} (Copia)`, deep-copies all exercises with fresh orderIndex values, and sets new `createdAt`/`updatedAt`

- GIVEN the duplicated name would collide with an existing routine
- WHEN system creates the duplicate
- THEN system appends a numeric suffix (e.g., "(Copia 2)") to ensure uniqueness

### REQ-RM-09: Exercise Reorder

The system SHALL allow users to reorder exercises within a routine.

- GIVEN user taps reorder controls (up/down) on an exercise card in create or edit mode
- WHEN the reorder action fires
- THEN system swaps `orderIndex` values between the moved exercise and its neighbor
- AND persists the updated order on save

### REQ-RM-10: Duplicate Exercise Within Routine

The system SHALL allow the same exercise to appear multiple times in a routine.

- GIVEN user adds an exercise already present in the routine
- WHEN the addition completes
- THEN system creates a separate RoutineExercise entry with a new orderIndex
- AND each entry can have different sets, reps, rest, and notes values

## Non-Functional Requirements

### NFR-RM-01: Offline Operation

- GIVEN Firestore offline persistence is enabled
- WHEN device has no network
- THEN user can view cached routines and perform create, edit, delete, and duplicate operations
- AND operations sync when connectivity resumes

### NFR-RM-02: Data Isolation

- GIVEN User A and User B exist
- WHEN User A creates a routine
- THEN User B MUST NOT see it (enforced by Firestore security rules: `users/{uid}/routines/{routineId}`)

### NFR-RM-03: Performance

- GIVEN a routine with ≤ 20 exercises
- WHEN user opens the detail screen
- THEN screen SHALL render within 500ms (single Firestore document read)