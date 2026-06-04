# Tasks: Auth + Exercise Catalog

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,600 (~800 JSON data) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain+Data / PR 2: Auth / PR 3: Exercise+Rules / PR 4: Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Data layer | PR 1 | Entities, repos, use cases, Firebase config, repos, seed JSON |
| 2 | Auth feature | PR 2 | AuthContext, auth screens, profile, auth navigation |
| 3 | Exercise feature + rules | PR 3 | Exercise screens, hooks, Firestore rules, app wiring |
| 4 | Tests | PR 4 | Unit + integration tests |

## Phase 1: Domain Foundation

- [ ] 1.1 Create entities: `UserProfile.ts`, `Exercise.ts`, `AuthCredentials.ts`
- [ ] 1.2 Create errors: `AuthError.ts`, `ValidationError.ts`, `NetworkError.ts`
- [ ] 1.3 Create repository interfaces: `IAuthRepository.ts`, `IExerciseRepository.ts`, `IUserMetadataRepository.ts`
- [ ] 1.4 Create use cases: `RegisterUser.ts`, `LoginUser.ts`, `SeedExercises.ts`, `UpdateProfile.ts`

## Phase 2: Data Layer

- [ ] 2.1 Create `firebaseConfig.ts` (singleton + offline persistence)
- [ ] 2.2 Create `FirebaseAuthRepository.ts` (implements `IAuthRepository`)
- [ ] 2.3 Create `FirestoreExerciseRepository.ts` (implements `IExerciseRepository`)
- [ ] 2.4 Create `FirestoreUserMetadataRepository.ts` (seed status, display name)
- [ ] 2.5 Create `assets/exercises-seed.json` (~80 exercises)

## Phase 3: Auth Presentation

- [ ] 3.1 Create `AuthContext.tsx` (user, loading, login, register, logout, seed trigger)
- [ ] 3.2 Create `useAuth.ts`
- [ ] 3.3 Create `LoginScreen.tsx` (email/password + error display)
- [ ] 3.4 Create `RegisterScreen.tsx` (email/password/confirm + validation)
- [ ] 3.5 Create `ProfileScreen.tsx` (email, editable name, sign-out)
- [ ] 3.6 Create `navigation/types.ts`, `AuthStack.tsx`

## Phase 4: Exercise Presentation

- [ ] 4.1 Create `useExercises.ts` (CRUD + filters)
- [ ] 4.2 Create `ExerciseStack.tsx`, `MainAppTabs.tsx`
- [ ] 4.3 Create `ExerciseListScreen.tsx` (list + muscle/equipment filters)
- [ ] 4.4 Create `ExerciseDetailScreen.tsx` (read-only for seeded)
- [ ] 4.5 Create `ExerciseCreateScreen.tsx` (form, uniqueness validation)
- [ ] 4.6 Create `ExerciseEditScreen.tsx` (custom only)
- [ ] 4.7 Create `LoadingScreen.tsx`

## Phase 5: Integration & Rules

- [ ] 5.1 Create `RootNavigator.tsx` (auth gate → AuthStack vs MainAppTabs)
- [ ] 5.2 Modify `App.tsx` to wire `AuthContext` + `RootNavigator`
- [ ] 5.3 Create `firestore.rules` (per-user isolation)
- [ ] 5.4 Modify `app.json` for Firebase env in `extra` if needed

## Phase 6: Testing

- [ ] 6.1 Unit tests: `RegisterUser`, `LoginUser`, `SeedExercises`, `UpdateProfile`
- [ ] 6.2 Unit tests: `Exercise` entity validation
- [ ] 6.3 Integration tests: `FirebaseAuthRepository` with Firebase Emulator
- [ ] 6.4 Integration tests: `FirestoreExerciseRepository` with Firebase Emulator
