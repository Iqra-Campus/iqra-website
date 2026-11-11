"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfigured, getAuthClient } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

const L = {
  en: { title: "Login", email: "Email", password: "Password", submit: "Sign in", out: "Sign out", err: "Sign-in failed. Check your email and password and try again.", nocfg: "Login is not available yet: Firebase is not configured.", hi: "Signed in as", admin: "Open admin dashboard" },
  bn: { title: "লগইন", email: "ইমেইল", password: "পাসওয়ার্ড", submit: "লগইন করুন", out: "লগআউট", err: "লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড দেখে আবার চেষ্টা করুন।", nocfg: "লগইন এখনো চালু হয়নি: Firebase কনফিগার করা হয়নি।", hi: "লগইন আছেন:", admin: "অ্যাডমিন ড্যাশবোর্ড খুলুন" },
};

export default function Login() {
  const { lang } = useParams<{ lang: "en" | "bn" }>();
  const t = L[lang] ?? L.en;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await signInWithEmailAndPassword(getAuthClient(), email, pw); router.push(`/${lang}/admin`); }
    catch { setErr(t.err); } finally { setBusy(false); }
  }
  const input = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2";
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{t.title}</h1>
      {!firebaseConfigured ? <p className="mt-6 rounded border border-gold-200 bg-white p-4 text-sm">{t.nocfg}</p>
      : user ? (
        <div className="mt-6 space-y-3 text-center">
          <p>{t.hi} {user.email}</p>
          {profile?.role && ["superAdmin", "admin"].includes(profile.role) && <a className="block rounded bg-sage-700 py-2 text-white" href={`/${lang}/admin`}>{t.admin}</a>}
          <button onClick={() => signOut(getAuthClient())} className="rounded border border-sage-300 px-4 py-2">{t.out}</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded border border-gold-200 bg-white p-6">
          <label className="block text-sm">{t.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
          <label className="block text-sm">{t.password}<input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={input} /></label>
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          <button disabled={busy} className="w-full rounded bg-sage-700 py-2 font-medium text-white disabled:opacity-60">{t.submit}</button>
        </form>
      )}
    </div>
  );
}
