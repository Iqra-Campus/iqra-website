# Firebase Setup

1. Firebase Console → Build → Authentication → Sign-in method → enable **Email/Password**.
2. Firestore Database → Rules → paste the contents of `firestore.rules` → **Publish**.
3. Project settings → Your apps → Web app → copy config into Vercel/`.env.local` (see `.env.example`).
4. Authentication → Settings → Authorized domains → add your Vercel domain.
5. First Super Admin (one-time): sign up/create your own user in Authentication, then in Firestore create
   `users/<YOUR_UID>` with fields: `role: "superAdmin"`, `status: "active"`, `displayName`, `email`.
   Roles cannot be set from the website; only from the Console or trusted server code.
