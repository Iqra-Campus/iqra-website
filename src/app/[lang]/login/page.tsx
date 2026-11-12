"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseConfigured, getAuthClient, getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

const L = {
  en: { title: "Login", signup: "Create account", name: "Full name", email: "Email", password: "Password (min 8 characters)", submit: "Sign in", create: "Create account", toSignup: "New student? Create an account", toLogin: "Already have an account? Sign in", out: "Sign out", err: "Sign-in failed. Check your email and password and try again.", serr: "Could not create the account. The email may already be in use, or the password is too short.", nocfg: "Login is not available yet: Firebase is not configured.", hi: "Signed in as", admin: "Open admin dashboard", pay: "My courses & payments" },
  bn: { title: "লগইন", signup: "অ্যাকাউন্ট খুলুন", name: "পূর্ণ নাম", email: "ইমেইল", password: "পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)", submit: "লগইন করুন", create: "অ্যাকাউন্ট খুলুন", toSignup: "নতুন শিক্ষার্থী? অ্যাকাউন্ট খুলুন", toLogin: "আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন", out: "লগআউট", err: "লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড দেখে আবার চেষ্টা করুন।", serr: "অ্যাকাউন্ট খোলা যায়নি। ইমেইলটি আগে ব্যবহৃত হতে পারে, অথবা পাসওয়ার্ড ছোট।", nocfg: "লগইন এখনো চালু হয়নি: Firebase কনফিগার করা হয়নি।", hi: "লগইন আছেন:", admin: "অ্যাডমিন ড্যাশবোর্ড খুলুন", pay: "আমার কোর্স ও পেমেন্ট" },
};

export default function Login() {
  const { lang } = useParams<{ lang: "en" | "bn" }>();
  const t = L[lang] ?? L.en;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = !!profile && ["superAdmin", "admin"].includes(profile.role ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const auth = getAuthClient();
      if (mode === "in") {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await setDoc(doc(getDb(), "users", cred.user.uid), {
          role: "student", status: "active", displayName: name.trim(), email: cred.user.email, createdAt: serverTimestamp(),
        });
      }
      router.push(`/${lang}/pay`);
    } catch { setErr(mode === "in" ? t.err : t.serr); } finally { setBusy(false); }
  }
  const input = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2";
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{mode === "in" ? t.title : t.signup}</h1>
      {!firebaseConfigured ? <p className="mt-6 rounded border border-gold-200 bg-white p-4 text-sm">{t.nocfg}</p>
      : user ? (
        <div className="mt-6 space-y-3 text-center">
          <p>{t.hi} {user.email}</p>
          {profile?.role === "teacher" && <a className="block rounded bg-sage-700 py-2 text-white" href={`/${lang}/teacher`}>{lang === "bn" ? "শিক্ষক পোর্টাল" : "Teacher portal"}</a>}
          {isAdmin && <a className="block rounded bg-sage-700 py-2 text-white" href={`/${lang}/admin`}>{t.admin}</a>}
          <a className="block rounded border border-sage-300 py-2" href={`/${lang}/pay`}>{t.pay}</a>
          <button onClick={() => signOut(getAuthClient())} className="rounded border border-sage-300 px-4 py-2">{t.out}</button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="mt-6 space-y-4 rounded border border-gold-200 bg-white p-6">
            {mode === "up" && <label className="block text-sm">{t.name}<input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={input} /></label>}
            <label className="block text-sm">{t.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
            <label className="block text-sm">{t.password}<input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} className={input} /></label>
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
            <button disabled={busy} className="w-full rounded bg-sage-700 py-2 font-medium text-white disabled:opacity-60">{mode === "in" ? t.submit : t.create}</button>
          </form>
          <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }} className="mt-4 block w-full text-center text-sm underline">{mode === "in" ? t.toSignup : t.toLogin}</button>
        </>
      )}
    </div>
  );
}
