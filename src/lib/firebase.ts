// Firebase client initialisation (no browser storage is used for application data).
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

export function getFirebaseApp() {
  if (!firebaseConfigured) throw new Error("Firebase is not configured.");
  return getApps().length ? getApp() : initializeApp(config);
}
export function getDb() { return getFirestore(getFirebaseApp()); }
export function getAuthClient() {
  const app = getFirebaseApp();
  try { return initializeAuth(app, { persistence: inMemoryPersistence }); } catch { return getAuth(app); }
}
