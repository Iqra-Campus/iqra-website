# IQRA CAMPUS Website

Next.js (App Router) + TypeScript + Tailwind + Firebase (Auth + Firestore). English and Bangla (`/en`, `/bn`).

## What is built
Public site (home, about, courses, teachers, pricing, reviews, blog, FAQ, contact, policies), free-trial booking,
student accounts, manual payment confirmation (admin verifies, then approves), class schedule and attendance,
homework, certificates with public verification, in-app notifications, teacher portal, parent portal,
and an admin dashboard (content, bookings, payments, schedule, homework, certificates, users).

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app values.
3. `npm run dev`

On Vercel add the same variables under Project → Settings → Environment Variables.
`NEXT_PUBLIC_SITE_URL` (optional) enables `sitemap.xml`.

## Firebase
- Authentication: enable Email/Password. Add your site domain under Authorized domains.
- Firestore: create in production mode and publish the security rules kept by the site owner (not stored in this public repository).
- First Super Admin: create your user in Authentication, then in Firestore create `users/<UID>` with
  `role: "superAdmin"`, `status: "active"`, `displayName`, `email`.
- Other roles (teacher, parent, admin) are set from the admin dashboard, Users tab (Super Admin only).

## Notes
- No payments are processed on the site. No browser storage is used for application data.
- Never commit `.env*` files, tokens or service-account files.
