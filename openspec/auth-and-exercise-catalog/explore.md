# Exploration: Auth + Exercise Catalog

## Status
`completed`

## Executive Summary
This feature establishes the two foundational pillars of the app: user identity (via Firebase anonymous auth) and the exercise domain model (via Firestore). The exploration covers architecture, data flow, navigation, and Firebase setup patterns specific to Expo + React Native.

---

## 1. Clean Architecture Folder Structure

For a React Native app with Firebase, this structure balances clarity with pragmatism:

```
src/
├── domain/
│   ├── entities/
│   │   ├── Exercise.ts
│   │   ├── UserProfile.ts
│   │   └── index.ts
│   ├── repositories/
│   │   ├── IExerciseRepository.ts
│   │   ├── IAuthRepository.ts
│   │   └── index.ts
│   └── usecases/
│       ├── auth/
│       │   ├── SignInAnonymously.ts
│       │   ├── GetCurrentUser.ts
│       │   └── SignOut.ts
│       └── exercise/
│           ├── GetExercises.ts
│           ├── CreateExercise.ts
│           └── SeedExercises.ts
├── data/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth/
│   │   │   └── FirebaseAuthRepository.ts
│   │   └── firestore/
│   │       └── FirestoreExerciseRepository.ts
│   └── local/
│       └── seed/
│           └── exercises.json
├── presentation/
│   ├── components/
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoadingScreen.tsx
│   │   └── exercise/
│   │       ├── ExerciseListScreen.tsx
│   │       ├── ExerciseDetailScreen.tsx
│   │       └── CreateExerciseScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   └── hooks/
│       ├── useAuth.ts
│       └── useExercises.ts
└── App.tsx
```

**Why this structure?**
- `domain/` is pure TypeScript, no framework dependencies. Testable in Node.js.
- `data/` contains Firebase specifics. If we migrate to Supabase, only this folder changes.
- `presentation/` contains React-specific code. Clean Architecture purists might want a `presentation/` + `application/` split, but for this scale, use cases act as the application layer.

---

## 2. Firebase Initialization Pattern for Expo

Expo has specific constraints (no native modules in managed workflow). We use the JS SDK exclusively.

```typescript
// src/data/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Key decisions:**
- Use Expo environment variables (`EXPO_PUBLIC_*`) for Firebase config
- Initialize once at module level (singleton pattern)
- Lazy-load Firestore collections on first use

---

## 3. Exercise Seeding Strategy

**Approach: JSON seed file + conditional batch write**

1. Store ~80 pre-loaded exercises in `src/data/local/seed/exercises.json`
2. On first app launch (after auth), check if user has exercises in Firestore
3. If not, batch-write the seed data to `users/{uid}/exercises/`
4. Mark user profile with `hasSeededExercises: true`

**Why not a global shared collection?**
- Anonymous users shouldn't see/edit other users' exercises
- Pre-loaded exercises need to be copied per-user so users can customize them (rename, add notes)
- Firebase security rules are simpler: `allow read, write: if request.auth.uid == userId`

**Tradeoff:** First launch has a ~2 second delay for seeding. Acceptable for MVP.

---

## 4. Navigation Map (MVP)

For this feature, we need:

1. **Loading/Auth Screen** (`LoadingScreen`)
   - Shows splash/logo while Firebase Auth initializes
   - Auto-signs in anonymously or restores existing session
   - Navigates to main app on success

2. **Link Account Screen** (`LinkAccountScreen`)
   - Prompts user to link anonymous account to email/password or Google
   - Can be skipped but prominently shown in profile/settings
   - Critical: prevents data loss on uninstall

3. **Exercise List** (`ExerciseListScreen`) — Tab 1
   - Searchable/filterable list of all exercises
   - Filters by muscle group and equipment
   - FAB to create custom exercise

4. **Exercise Detail** (`ExerciseDetailScreen`) — Stack push
   - View exercise info
   - Edit custom exercises (pre-loaded are read-only)
   - Show "Used in X routines" (future feature)

5. **Create Exercise** (`CreateExerciseScreen`) — Modal/Stack push
   - Form with name, muscle group picker, equipment picker
   - Validation and duplicate checking

```
App (StackNavigator)
└── LoadingScreen (initial)
    └── MainApp (BottomTabNavigator)
        ├── Exercises (StackNavigator)
        │   ├── ExerciseListScreen
        │   ├── ExerciseDetailScreen
        │   └── CreateExerciseScreen
        └── Profile (StackNavigator)
            └── LinkAccountScreen
```

---

## 5. State Management Recommendation

**React Context + useReducer + custom hooks** for MVP.

Why not Redux/Zustand/Recoil yet?
- App is small (2-3 features)
- Firebase provides real-time sync (less need for global state)
- Context is native, no extra dependencies
- Easy to migrate to Zustand later if needed

**Pattern:**
- `AuthContext` at root level, provides `{ user, isLoading, signIn, signOut }`
- `useExercises()` hook encapsulates Firestore queries and caching
- Components consume these hooks, no direct Firebase calls in UI

---

## 6. Firebase Security Rules Sketch

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Exercises subcollection
      match /exercises/{exerciseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Key constraints:**
- All data is per-user, no shared collections
- Anonymous auth UIDs are valid and persistent per device
- Validate `isCustom` field can't be changed on pre-loaded exercises (application-level)

---

## 7. Auth Architecture (Anonymous + Account Linking)

**User requirement:** Account linking (email/password or Google) is a **core MVP feature**, not a post-launch addition. Data must persist across uninstalls and devices.

**Auth Flow:**
1. **Onboarding**: App auto-signs in anonymously (zero friction)
2. **Tracking starts**: User can immediately use the app
3. **Link prompt**: After first workout OR via Profile, user is prompted to link account
4. **Linking options**: Email/password (form) or Google Sign-In (OAuth)
5. **Post-link**: Anonymous UID is merged with permanent account; all Firestore data remains accessible

**Firebase Auth Methods Used:**
- `signInAnonymously()` — onboarding
- `linkWithCredential()` — upgrade anonymous to permanent
- `signInWithEmailAndPassword()` / `signInWithPopup(Google)` — returning users
- `onAuthStateChanged()` — session persistence

**Data Migration on Link:**
- Firestore documents are under `users/{uid}/`. When linking succeeds, Firebase Auth merges the anonymous UID with the new account.
- All existing data remains accessible under the same UID.
- No manual data migration needed if linking happens before the anonymous UID is lost.

**Pros:**
- Zero-friction onboarding (anonymous)
- Data persistence guaranteed (account linking)
- Cross-device access once linked
- Can still use app fully without linking (but at risk)

**Risks:**
- If user uninstalls BEFORE linking, data is orphaned (unavoidable, but mitigated by early prompting)
- Google Sign-In requires Expo dev build or EAS (not available in Expo Go)
- Email/password requires validation flow (reset password, etc.)

---

## 8. Open Questions & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firestore reads cost money at scale | Medium | Denormalize exercise history; use local caching |
| Anonymous user data loss on uninstall | High | Account linking is MVP-required; prompt early and prominently |
| Exercise seed file size (~80 exercises) | Low | JSON is ~15KB, batch write is fast |
| Offline support for gym (no wifi) | Medium | Enable Firestore offline persistence |
| React Native Firebase JS SDK limitations | Low | All features we need work in managed Expo |
| Google Sign-In complexity in Expo Go | Medium | Use `expo-auth-session` or require dev build for Google |

---

## Next Recommended Phase
**`/sdd-propose`** — Create a formal change proposal with intent, scope, and approach based on this exploration.
