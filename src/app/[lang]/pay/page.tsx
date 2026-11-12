"use client";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import StudentClasses from "@/components/StudentClasses";
import StudentHomework from "@/components/StudentHomework";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
const L = {
  en: { title: "My courses & payments", login: "Please sign in or create an account first.", loginBtn: "Sign in / Create account", pay: "Confirm a payment", how: "Send the course fee using one of the methods below, then submit the details here. Your course opens after the administrator checks and approves it.", course: "Course", method: "Payment method", account: "Account / number", holder: "Account holder", bank: "Bank", branch: "Branch", swift: "SWIFT / IBAN", amount: "Amount sent", currency: "Currency", sender: "The account/number you sent from", trx: "Transaction ID / reference", submit: "Submit payment confirmation", sending: "Submitting…", ok: "Submitted. Status: pending review. Access is not active until it is approved.", fail: "Could not submit. This transaction ID may already have been submitted, or a detail is invalid.", myReq: "My payment requests", myCourses: "My enrolled courses", none: "Nothing yet.", pending: "Pending review", approved: "Approved", rejected: "Rejected", reason: "Reason", noMethods: "No payment method has been published yet. Please contact us.", noCourses: "No course is published yet.", choose: "— choose —", nocfg: "Not available yet." },
  bn: { title: "আমার কোর্স ও পেমেন্ট", login: "আগে লগইন করুন বা অ্যাকাউন্ট খুলুন।", loginBtn: "লগইন / অ্যাকাউন্ট খুলুন", pay: "পেমেন্ট নিশ্চিত করুন", how: "নিচের যেকোনো একটি মাধ্যমে কোর্স ফি পাঠান, তারপর এখানে তথ্য জমা দিন। অ্যাডমিন যাচাই করে অনুমোদন দিলে কোর্স চালু হবে।", course: "কোর্স", method: "পেমেন্টের মাধ্যম", account: "একাউন্ট / নম্বর", holder: "একাউন্টধারী", bank: "ব্যাংক", branch: "শাখা", swift: "SWIFT / IBAN", amount: "পাঠানো পরিমাণ", currency: "মুদ্রা", sender: "যে একাউন্ট/নম্বর থেকে পাঠিয়েছেন", trx: "ট্রানজেকশন আইডি / রেফারেন্স", submit: "পেমেন্ট নিশ্চিতকরণ জমা দিন", sending: "জমা হচ্ছে…", ok: "জমা হয়েছে। অবস্থা: যাচাই চলছে। অনুমোদনের আগে অ্যাক্সেস চালু হবে না।", fail: "জমা দেওয়া যায়নি। এই ট্রানজেকশন আইডি আগে জমা হয়ে থাকতে পারে, অথবা কোনো তথ্য ভুল।", myReq: "আমার পেমেন্ট অনুরোধ", myCourses: "আমার ভর্তি হওয়া কোর্স", none: "এখনো কিছু নেই।", pending: "যাচাই চলছে", approved: "অনুমোদিত", rejected: "বাতিল", reason: "কারণ", noMethods: "এখনো কোনো পেমেন্ট মাধ্যম প্রকাশ করা হয়নি। যোগাযোগ করুন।", noCourses: "এখনো কোনো কোর্স প্রকাশিত হয়নি।", choose: "— বাছুন —", nocfg: "এখনো চালু হয়নি।" },
};
const tx = (d: D | undefined, k: string, lang: string) => (d?.[k]?.[lang] || d?.[k]?.en || "") as string;

function Inner() {
  const { lang } = useParams<{ lang: "en" | "bn" }>();
  const t = L[lang] ?? L.en;
  const { user, profile, loading, configured } = useAuth();
  const [courses, setCourses] = useState<D[]>([]);
  const [methods, setMethods] = useState<D[]>([]);
  const [reqs, setReqs] = useState<D[]>([]);
  const [enr, setEnr] = useState<D[]>([]);
  const [courseId, setCourseId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "fail">("idle");

  const load = useCallback(async () => {
    if (!user) return;
    const db = getDb();
    const m = (s: Awaited<ReturnType<typeof getDocs>>) => s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as D);
    try {
      const [c, pm, r, e] = await Promise.all([
        getDocs(query(collection(db, "courses"), where("status", "==", "published"))),
        getDocs(query(collection(db, "paymentMethods"), where("status", "==", "published"))),
        getDocs(query(collection(db, "paymentRequests"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "enrollments"), where("userId", "==", user.uid))),
      ]);
      setCourses(m(c)); setMethods(m(pm));
      setReqs(m(r).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))); setEnr(m(e));
    } catch { /* shown as empty */ }
  }, [user]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const q = new URLSearchParams(window.location.search).get("course"); if (q) setCourseId(q); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const method = methods.find((x) => x.id === methodId);
    const trxId = g("trx");
    const trxKey = trxId.toLowerCase();
    setState("sending");
    try {
      await setDoc(doc(getDb(), "paymentRequests", `${methodId}_${trxKey}`), {
        userId: user.uid, userName: profile?.displayName || user.email || "", userEmail: user.email || "",
        courseId, methodId, methodName: tx(method, "name", "en") || methodId,
        amount: Number(g("amount")), currency: g("currency").toUpperCase(), senderAccount: g("sender"),
        transactionId: trxId, trxKey, status: "pending", createdAt: serverTimestamp(),
      });
      setState("ok"); e.currentTarget.reset(); await load();
    } catch { setState("fail"); }
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2";
  if (!configured) return <p className="p-10 text-center">{t.nocfg}</p>;
  if (loading) return <p className="p-10 text-center">…</p>;
  if (!user) return <div className="p-10 text-center"><p>{t.login}</p><a className="mt-3 inline-block rounded bg-sage-700 px-5 py-2 text-white" href={`/${lang}/login`}>{t.loginBtn}</a></div>;

  const method = methods.find((x) => x.id === methodId);
  const cTitle = (id: string) => tx(courses.find((c) => c.id === id), "title", lang) || id;
  const label = (s: string) => (s === "approved" ? t.approved : s === "rejected" ? t.rejected : t.pending);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <h1 className="text-center font-serif text-3xl text-sage-900">{t.title}</h1>

      <section>
        <h2 className="font-serif text-xl text-sage-900">{t.myCourses}</h2>
        {enr.length === 0 ? <p className="mt-2 text-sage-700">{t.none}</p> : (
          <ul className="mt-2 space-y-2">{enr.map((x) => <li key={x.id} className="rounded border border-sage-300 bg-white p-3">{cTitle(x.courseId)}</li>)}</ul>
        )}
      </section>

      <StudentClasses lang={lang} userId={user.uid} courseIds={enr.map((x) => x.courseId)} titles={Object.fromEntries(courses.map((c) => [c.id, tx(c, "title", lang)]))} />

      <StudentHomework lang={lang} userId={user.uid} userName={profile?.displayName || user.email || ""} courseIds={enr.map((x) => x.courseId)} />

      <section>
        <h2 className="font-serif text-xl text-sage-900">{t.pay}</h2>
        <p className="mt-2 text-sm text-sage-700">{t.how}</p>
        {courses.length === 0 ? <p className="mt-3">{t.noCourses}</p> : methods.length === 0 ? <p className="mt-3">{t.noMethods}</p> : (
          <form onSubmit={submit} className="mt-4 grid gap-4 rounded border border-gold-200 bg-white p-5 sm:grid-cols-2">
            <label className="text-sm">{t.course}
              <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inp}>
                <option value="">{t.choose}</option>{courses.map((c) => <option key={c.id} value={c.id}>{tx(c, "title", lang)}</option>)}</select></label>
            <label className="text-sm">{t.method}
              <select required value={methodId} onChange={(e) => setMethodId(e.target.value)} className={inp}>
                <option value="">{t.choose}</option>{methods.map((m) => <option key={m.id} value={m.id}>{tx(m, "name", lang)}</option>)}</select></label>
            {method && (
              <div className="rounded bg-cream p-3 text-sm sm:col-span-2">
                {method.accountNumber && <p>{t.account}: <b>{method.accountNumber}</b></p>}
                {method.accountName && <p>{t.holder}: {method.accountName}</p>}
                {method.bankName && <p>{t.bank}: {method.bankName}</p>}
                {method.branch && <p>{t.branch}: {method.branch}</p>}
                {method.swift && <p>{t.swift}: {method.swift}</p>}
                {tx(method, "instructions", lang) && <p className="mt-1 whitespace-pre-line text-sage-700">{tx(method, "instructions", lang)}</p>}
              </div>
            )}
            <label className="text-sm">{t.amount}<input name="amount" type="number" step="any" min="0.01" required className={inp} /></label>
            <label className="text-sm">{t.currency}<input key={methodId} name="currency" required minLength={3} maxLength={5} defaultValue={method?.currency ?? ""} className={inp} /></label>
            <label className="text-sm sm:col-span-2">{t.sender}<input name="sender" required minLength={3} maxLength={60} className={inp} /></label>
            <label className="text-sm sm:col-span-2">{t.trx}<input name="trx" required pattern="[A-Za-z0-9._\-]{4,40}" className={inp} /></label>
            {state === "fail" && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{t.fail}</p>}
            {state === "ok" && <p role="status" className="text-sm text-sage-700 sm:col-span-2">{t.ok}</p>}
            <button disabled={state === "sending" || !courseId || !methodId} className="rounded bg-sage-700 py-3 font-medium text-white disabled:opacity-60 sm:col-span-2">{state === "sending" ? t.sending : t.submit}</button>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl text-sage-900">{t.myReq}</h2>
        {reqs.length === 0 ? <p className="mt-2 text-sage-700">{t.none}</p> : (
          <ul className="mt-2 space-y-2">{reqs.map((r) => (
            <li key={r.id} className="rounded border border-sage-300 bg-white p-3 text-sm">
              <p><b>{cTitle(r.courseId)}</b> · {r.amount} {r.currency} · {r.methodName}</p>
              <p>{r.transactionId} — <b>{label(r.status)}</b></p>
              {r.status === "rejected" && r.rejectReason && <p className="text-red-700">{t.reason}: {r.rejectReason}</p>}
            </li>))}</ul>
        )}
      </section>
    </div>
  );
}
export default function Pay() { return <Suspense fallback={<p className="p-10 text-center">…</p>}><Inner /></Suspense>; }
