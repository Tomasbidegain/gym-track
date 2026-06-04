# Exploration: Auth + Exercise Catalog

## Status
`completed` (updated — corrected Firebase auth persistence and navigation dependencies)

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

**CRITICAL**: For Firebase JS SDK v10+ (we're on v12.14.0), `getAuth()` does NOT persist auth state across app restarts in React Native. You MUST use `initializeAuth` with `getReactNativePersistence(AsyncStorage)`. See: https://expo.fyi/firebase-js-auth-setup

### Required dependency (NOT YET INSTALLED)
```bash
npx expo install @react-native-async-storage/async-storage
```

### Initialization code
```typescript
// src/data/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// CRITICAL: Use initializeAuth + AsyncStorage persistence for React Native
// Using getAuth() alone will lose auth state on app restart
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
```

**Key decisions:**
- Use Expo environment variables (`EXPO_PUBLIC_*`) for Firebase config
- Use `initializeAuth` (NOT `getAuth`) with AsyncStorage persistence — this is mandatory for auth state to survive app restarts
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

**Alternative considered:** Global read-only collection for pre-loaded exercises + per-user collection for custom only. This reduces Firestore writes but complicates queries (need to merge two sources). Rejected for MVP simplicity.

---

## 4. Navigation Map (MVP)

### Current dependencies (installed)
- `@react-navigation/native` ^7.2.5
- `@react-navigation/native-stack` ^7.16.0
- `react-native-screens` ^4.25.2
- `react-native-safe-area-context` ^5.8.0

### NOT installed
- `@react-navigation/bottom-tabs` — needed if we want tab navigation

### Recommendation: Stack-only for MVP
For this feature scope, a stack-only navigation is sufficient. Bottom tabs can be added when the second feature (e.g., routines/workouts) is introduced.

### React Navigation v7: Use Static API
React Navigation v7 recommends the **static API** (`createStaticNavigation`) over the dynamic API. This is simpler and type-safe.

### Screens needed

1. **Loading/Auth Screen** (`LoadingScreen`)
   - Shows splash/logo while Firebase Auth initializes
   - Auto-signs in anonymously or restores existing session
   - Navigates to exercise list on success

2. **Exercise List** (`ExerciseListScreen`)
   - Searchable/filterable list of all exercises
   - Filters by muscle group and equipment
   - FAB to create custom exercise

3. **Exercise Detail** (`ExerciseDetailScreen`) — Stack push
   - View exercise info
   - Edit custom exercises (pre-loaded are read-only)

4. **Create Exercise** (`CreateExerciseScreen`) — Stack push or formSheet modal
   - Form with name, muscle group picker, equipment picker
   - Validation and duplicate checking

### Navigation structure (MVP)
```
App (createStaticNavigation)
└── RootStack (NativeStack)
    ├── LoadingScreen (initial, headerShown: false)
    └── ExerciseListScreen
        ├── ExerciseDetailScreen
        └── CreateExerciseScreen (presentation: 'formSheet')
```

When a second feature is added (routines), install `@react-navigation/bottom-tabs` and restructure:
```
App
└── RootStack
    ├── LoadingScreen
    └── MainTabs (BottomTabNavigator)
        ├── Exercises (Stack)
        │   ├── ExerciseListScreen
        │   ├── ExerciseDetailScreen
        │   └── CreateExerciseScreen
        └── Routines (Stack) — future
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

## 7. Anonymous Auth Considerations

**Pros:**
- Zero friction, user starts tracking in <5 seconds
- Firebase Auth persists the anonymous session across app restarts (with proper AsyncStorage setup)
- Can link to permanent auth later (email/password, Google, etc.)

**Risks:**
- If user uninstalls the app, anonymous UID is lost (data orphaned in Firestore)
- Need to implement "link account" feature before MVP launch if we want data persistence
- Firebase has limits on anonymous auth (100k users/day on Spark plan — fine for personal use)

**Mitigation:** Add a prominent "Save your progress" button that links to email/password or Google auth.

---

## 8. Dependencies to Install (Summary)

| Package | Purpose | Status |
|---------|---------|--------|
| `firebase` | Firebase SDK | Installed (v12.14.0) |
| `@react-navigation/native` | Navigation core | Installed (v7.2.5) |
| `@react-navigation/native-stack` | Stack navigator | Installed (v7.16.0) |
| `react-native-screens` | Native screen optimization | Installed (v4.25.2) |
| `react-native-safe-area-context` | Safe area insets | Installed (v5.8.0) |
| `@react-native-async-storage/async-storage` | Auth persistence | **NOT INSTALLED — REQUIRED** |
| `@react-navigation/bottom-tabs` | Tab navigation | Not installed — defer to next feature |

---

## 9. Open Questions & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firestore reads cost money at scale | Medium | Denormalize exercise history; use local caching |
| Anonymous user data loss on uninstall | High | Implement account linking before public release |
| Exercise seed file size (~80 exercises) | Low | JSON is ~15KB, batch write is fast |
| Offline support for gym (no wifi) | Medium | Enable Firestore offline persistence (enabled by default on RN) |
| Firebase auth persistence broken if using getAuth() | **Critical** | Use initializeAuth + getReactNativePersistence(AsyncStorage) |
| AsyncStorage not installed | **Critical** | Install before implementing auth |
| React Native Firebase JS SDK limitations | Low | All features we need work in managed Expo |

---

## Next Recommended Phase
**`/sdd-propose`** — Create a formal change proposal with intent, scope, and approach based on this exploration.
