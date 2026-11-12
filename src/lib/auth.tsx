"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getAuthClient, getDb } from "@/lib/firebase";

export type Profile = { role?: string; status?: string; displayName?: string } | null;
type Ctx = { user: User | null; profile: Profile; loading: boolean; configured: boolean; refreshProfile: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, profile: null, loading: true, configured: false, refreshProfile: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  const refreshProfile = useCallback(async () => {
    const u = getAuthClient().currentUser;
    if (!u) return;
    try {
      const snap = await getDoc(doc(getDb(), "users", u.uid));
      setProfile(snap.exists() ? (snap.data() as Profile) : null);
    } catch { /* keep current profile */ }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(getAuthClient(), async (u) => {
      setUser(u);
      try {
        const snap = u ? await getDoc(doc(getDb(), "users", u.uid)) : null;
        setProfile(snap && snap.exists() ? (snap.data() as Profile) : null);
      } catch { setProfile(null); }
      setLoading(false);
    });
  }, []);

  return <AuthCtx.Provider value={{ user, profile, loading, configured: firebaseConfigured, refreshProfile }}>{children}</AuthCtx.Provider>;
}
