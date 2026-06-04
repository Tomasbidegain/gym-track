# Proposal: Auth + Exercise Catalog

## Intent

Establish the two foundational pillars of the gym tracker: mandatory user identity (email/password registration and login via Firebase Auth) and a per-user exercise catalog (~80 pre-loaded exercises with CRUD). Users must authenticate before accessing any app features. Without these, nothing else can be built.

## Scope

### In Scope
- Mandatory email/password login or registration on first launch (gated access, no anonymous onboarding)
- ~80 pre-loaded exercises seeded per-user from JSON on first launch
- Exercise listing with muscle group and equipment filters
- Custom exercise creation, editing, and viewing
- Per-user Firestore data isolation via security rules
- Navigation: AuthGate (Login/Register) → MainApp (Exercises tab, Profile tab)
- Firestore offline persistence for gym use

### Out of Scope
- Anonymous sign-in (removed per product decision)
- Google Sign-In (deferred to future SDD change — requires EAS build)
- Routine management, workout sessions, progress tracking
- Social features, sharing, admin dashboard
- Email verification / password reset flows (post-MVP)

## Capabilities

### New Capabilities
- `user-auth`: Email/password registration, email/password login, session persistence, sign-out, auth-gate navigation
- `exercise-catalog`: Seed ~80 exercises per-user on first launch, list/filter exercises, create/edit/view custom exercises
- `app-navigation`: Auth gate (Login/Register), bottom tab navigator (Exercises, Profile), exercise stack screens

### Modified Capabilities
None — greenfield project.

## Approach

**Architecture**: Clean Architecture with three layers.
- `domain/` — Pure TypeScript entities (Exercise, UserProfile), repository interfaces, use cases. No framework deps.
- `data/` — Firebase JS SDK implementations (FirebaseAuthRepository, FirestoreExerciseRepository) + JSON seed file.
- `presentation/` — React Native screens, React Context (AuthContext) + custom hooks (`useAuth`, `useExercises`).

**Auth Flow**: `AuthGateScreen` on app open. If no session: show Login/Register tabs. If session exists: auto-navigate to MainApp. `createUserWithEmailAndPassword()` for registration, `signInWithEmailAndPassword()` for login. `onAuthStateChanged()` gates navigation. No anonymous auth. All Firestore data lives under `users/{uid}/`.

**State**: React Context + hooks for MVP. No Redux/Zustand yet — Firebase handles real-time sync.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/` | New | Entities, repository interfaces, use cases |
| `src/data/firebase/` | New | Firebase Auth + Firestore repositories, config, seed JSON |
| `src/presentation/` | New | Screens, navigation, context, hooks |
| `src/App.tsx` | New | Root component with providers |
| `firestore.rules` | New | Per-user data isolation |
| `app.json` | Modified | Expo config, env vars |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| User friction at onboarding (must register before use) | Medium | Clean login/register UX with clear value proposition; no unnecessary fields |
| Firestore reads cost at scale | Low (MVP) | Firestore offline persistence enabled; local caching in hooks |
| Exercise seeding delay on first login (~2s) | Low | Show loading indicator; batch write is O(1) round trip |
| Offline gym use without connectivity | Medium | Firestore offline persistence enabled at init |

## Rollback Plan

Firebase project is isolated. To rollback: delete the Firebase project and reinitialize. Code-wise: revert the commit that introduced `src/domain/`, `src/data/`, and `src/presentation/` directories. No database migrations exist at this stage.

## Dependencies

- Firebase project created with Auth (email/password enabled) and Firestore
- Expo SDK 56 initialized (`npx create-expo-app`)
- `.env` file with Firebase config keys

## Success Criteria

- [ ] App shows Login/Register screen on first open; no auto-anonymous sign-in
- [ ] User can register with email/password and immediately access the app
- [ ] User can login with existing credentials and access their data
- [ ] 80+ exercises appear in the list after first login seeding completes
- [ ] Exercises are filterable by muscle group and equipment
- [ ] User can create a custom exercise and see it in their list
- [ ] User can sign out and sign back in with same credentials
- [ ] Signed-in user's exercises persist across sessions
- [ ] User B cannot see User A's data (security rules verified)
