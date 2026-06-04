# Routine Exercise Selection Specification

## Purpose

Modal exercise picker for selecting exercises from the catalog when creating or editing a routine. Supports multi-select, search/filter, and configuration of training parameters (sets, reps, rest, notes) for each selected exercise.

## Requirements

### REQ-RES-01: Exercise Picker Access

The system SHALL provide an exercise picker modal accessible from RoutineCreate and RoutineEdit screens.

- GIVEN user taps "Add exercises" on RoutineCreate or RoutineEdit screen
- WHEN the picker opens
- THEN system presents the exercise catalog in multi-select mode as a modal screen

### REQ-RES-02: Multi-Select from Catalog

The system SHALL allow selecting multiple exercises at once from the catalog.

- GIVEN picker displays the exercise catalog
- WHEN user taps one or more exercise items
- THEN each tapped exercise toggles its selected state (checked/unchecked)

- GIVEN user has selected one or more exercises
- WHEN user taps "Done"
- THEN system returns all selected exercises to the calling screen
- AND each selected exercise is converted to a RoutineExercise with default parameter values

- GIVEN user has selected no exercises
- WHEN user taps "Done"
- THEN system returns no new exercises and closes the picker

### REQ-RES-03: Default Parameter Values

When exercises are added to a routine, the system SHALL assign default training parameters:

| Parameter | Default Value |
|-----------|---------------|
| sets | 3 |
| reps | "8-12" |
| restSeconds | 90 |
| notes | undefined (empty) |

- GIVEN an exercise is selected from the picker
- WHEN it is added to the routine exercise list
- THEN it SHALL receive the default values for sets, reps, restSeconds
- AND user can override any default value before saving

### REQ-RES-04: Search and Filter in Picker

The system SHALL support search and filter within the exercise picker.

- GIVEN picker is open
- WHEN user types in the search field
- THEN system filters exercises by name (case-insensitive substring match)

- GIVEN picker is open
- WHEN user selects a muscle group filter
- THEN system filters exercises by that muscle group

- GIVEN picker is open
- WHEN user selects an equipment filter
- THEN system filters exercises by that equipment type

- GIVEN picker has active filters and search
- WHEN exercises are displayed
- THEN system applies ALL filters and search simultaneously ( conjunction)

- GIVEN user clears search and filters
- WHEN the picker re-renders
- THEN system restores the full exercise catalog

### REQ-RES-05: Pre-Selected Exercises

The system SHALL show previously selected exercises as already checked when re-entering the picker.

- GIVEN user is editing an existing routine with exercises already added
- WHEN the picker opens
- THEN exercises already in the routine SHALL appear as pre-selected (checked)

- GIVEN user adds new exercises from the picker and returns to the create/edit screen
- WHEN user opens the picker again
- THEN all previously confirmed exercises SHALL remain selected

### REQ-RES-06: Exercise Parameter Editing

The system SHALL allow editing training parameters per exercise within the routine create/edit screen.

- GIVEN exercises have been added to the routine
- WHEN user taps on a parameter (sets, reps, restSeconds, notes) for an exercise
- THEN system presents an inline editor for that parameter

- GIVEN user edits sets to a value < 1
- WHEN validation runs on save
- THEN system rejects with "Los sets deben ser al menos 1"

- GIVEN user edits restSeconds to a value < 0
- WHEN validation runs on save
- THEN system rejects with "El descanso no puede ser negativo"

### REQ-RES-07: Exercise Removal from Routine

The system SHALL allow removing an exercise from the routine (not from the catalog).

- GIVEN a routine has multiple exercises
- WHEN user removes one exercise from the list
- THEN system removes that RoutineExercise entry
- AND system reindexes remaining `orderIndex` values to maintain sequential order

- GIVEN a routine has exactly one exercise
- WHEN user removes it
- THEN system shows "Agregá al menos un ejercicio" and prevents save until another is added

## Non-Functional Requirements

### NFR-RES-01: Picker State Communication

- GIVEN React Navigation v6 does not support serializable callbacks in route params
- WHEN the picker completes selection
- THEN system SHALL communicate selected exercises via a temporary React Context or event emitter (NOT via route params)

### NFR-RES-02: Picker Performance

- GIVEN the exercise catalog contains ~80 seeded entries plus user entries
- WHEN the picker renders and filters
- THEN the list SHALL remain responsive (filter results within 100ms)