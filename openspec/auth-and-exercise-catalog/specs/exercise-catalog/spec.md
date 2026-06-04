# Exercise Catalog Specification

## Purpose

Per-user exercise catalog seeded with ~80 pre-loaded exercises on first login. Users can list, filter, create, edit, and view exercises. Pre-loaded exercises cannot be edited; custom exercises belong to the creating user only.

## Requirements

### REQ-EC-01: Exercise Entity

An exercise SHALL have the following fields:

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| id | string | Auto-gen | UUID |
| name | string | Yes | Unique per user; 1–100 chars |
| muscleGroup | enum | Yes | One of: chest, back, shoulders, biceps, triceps, legs, core, forearms, glutes, calves |
| equipment | enum | Yes | One of: barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, other |
| isCustom | boolean | Auto | `false` for seeded, `true` for user-created |
| createdAt | timestamp | Auto | Server timestamp |
| updatedAt | timestamp | Auto | Server timestamp |

### REQ-EC-02: First-Login Seeding

The system SHALL seed ~80 pre-loaded exercises into the user's Firestore subcollection on first authenticated session.

- GIVEN user registers or logs in for the first time
- WHEN authenticated UID has no exercises in `users/{uid}/exercises`
- THEN system batch-writes ~80 seeded exercises from JSON with `isCustom: false`
- AND seeding completes within one Firestore round trip (batched write)

- GIVEN user has previously seeded exercises
- WHEN user logs in again
- THEN system MUST NOT re-seed (skip seeding entirely)

### REQ-EC-03: Exercise List and Filters

The system SHALL display all user exercises in a scrollable list.

- GIVEN user has exercises
- WHEN viewing the exercise list
- THEN system displays exercise name, muscle group, and equipment

- GIVEN user has exercises
- WHEN user selects a muscle group filter
- THEN system shows only exercises matching that muscle group

- GIVEN user has exercises
- WHEN user selects an equipment filter
- THEN system shows only exercises matching that equipment

- GIVEN filters are active
- WHEN user clears filters
- THEN system restores full exercise list

### REQ-EC-04: Custom Exercise Creation

The system SHALL allow authenticated users to create custom exercises.

- GIVEN user is authenticated
- WHEN user submits name + muscleGroup + equipment
- THEN system creates exercise with `isCustom: true` and adds to list

- GIVEN user submits a name identical to an existing exercise in their catalog
- WHEN creation is attempted
- THEN system rejects with "Exercise name already exists"

- GIVEN user submits with empty required fields
- WHEN creation is attempted
- THEN system validates and shows per-field errors

### REQ-EC-05: Custom Exercise Editing

The system SHALL allow users to edit custom exercises they created.

- GIVEN user taps a custom exercise (`isCustom: true`)
- WHEN user modifies fields and saves
- THEN system updates the exercise in Firestore

- GIVEN user taps a pre-loaded exercise (`isCustom: false`)
- WHEN user views detail
- THEN edit controls MUST NOT be available

### REQ-EC-06: Exercise Detail View

The system SHALL display full exercise details on tap.

- GIVEN user taps any exercise in the list
- WHEN detail screen opens
- THEN system displays name, muscle group, equipment, and custom/seeded label

### NFR-EC-01: Offline Exercise Access

- GIVEN Firestore offline persistence is enabled
- WHEN device has no network
- THEN user can browse cached exercises and view details

### NFR-EC-02: Seeding Performance

- GIVEN first-login seeding triggers
- WHEN batch write completes
- THEN UI shows loading for ≤ 2 seconds (acceptable threshold)

### NFR-EC-03: Data Isolation

- GIVEN User A and User B exist
- WHEN User A creates an exercise
- THEN User B MUST NOT see it (enforced by Firestore security rules)