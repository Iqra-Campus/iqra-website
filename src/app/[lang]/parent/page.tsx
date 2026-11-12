"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Child = { link: D; enrollments: D[]; attendance: Record<string, number>; subs: D[]; payments: D[] };

export default function Parent() {
  const { lang } = useParams<{ lang: string }>();
  const { user, profile, loading, configured } = useAuth();
  const [kids, setKids] = useState<Child[] | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const allowed = !!profile && profile.status === "active" && profile.role === "parent";
  const bn = lang === "bn";

  useEffect(() => {
    if (!allowed || !user) return;
    (async () => {
      try {
        const db = getDb();
        const m = (s: Awaited<ReturnType<typeof getDocs>>) => s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as D);
        const cs = await getDocs(query(collection(db, "courses"), where("status", "==", "published")));
        setTitles(Object.fromEntries(cs.docs.map((d) => [d.id, d.data().title?.[lang] || d.data().title?.en || d.id])));
        const links = m(await getDocs(query(collection(db, "parentLinks"), where("parentId", "==", user.uid))));
        const out: Child[] = [];
        for (const link of links) {
          const sid = link.studentId as string;
          const [e, a, s, p] = await Promise.all([
            getDocs(query(collection(db, "enrollments"), where("userId", "==", sid))),
            getDocs(query(collection(db, "attendance"), where("userId", "==", sid))),
            getDocs(query(collection(db, "submissions"), where("userId", "==", sid))),
            getDocs(query(collection(db, "paymentRequests"), where("userId", "==", sid))),
          ]);
          const att: Record<string, number> = {}; a.docs.forEach((d) => { const k = d.data().status as string; att[k] = (att[k] ?? 0) + 1; });
          out.push({ link, enrollments: m(e), attendance: att, subs: m(s), payments: m(p) });
        }
        setKids(out);
      } catch { setErr(bn ? "তথ্য লোড করা যায়নি।" : "Could not load information."); setKids([]); }
    })();
  }, [allowed, user, lang, bn]);

  if (!configured) return <p className="p-10 text-center">{bn ? "এখনো চালু হয়নি।" : "Not available yet."}</p>;
  if (loading) return <p className="p-10 text-center">…</p>;
  if (!user) return <p className="p-10 text-center"><a className="underline" href={`/${lang}/login`}>{bn ? "লগইন করুন" : "Please sign in"}</a></p>;
  if (!allowed) return <p className="p-10 text-center">{bn ? "প্রবেশাধিকার নেই। এই পেজ অভিভাবকদের জন্য।" : "Access denied. This page is for parents."}</p>;

  const st = (s: string) => (bn ? ({ pending: "যাচাই চলছে", approved: "অনুমোদিত", rejected: "বাতিল" } as Record<string, string>)[s] : s) ?? s;
  const attLabel = (k: string) => (bn ? ({ present: "উপস্থিত", late: "দেরিতে", absent: "অনুপস্থিত", excused: "অনুমোদিত ছুটি" } as Record<string, string>)[k] : k) ?? k;
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <h1 className="font-serif text-3xl text-sage-900">{bn ? "অভিভাবক পোর্টাল" : "Parent Portal"}</h1>
      {err && <p role="alert" className="text-red-700">{err}</p>}
      {kids === null ? <p>…</p> : kids.length === 0 ? <p className="text-sage-700">{bn ? "এখনো কোনো সন্তান যুক্ত করা হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।" : "No child is linked to your account yet. Please contact the administrator."}</p> : kids.map((k) => (
        <section key={k.link.id} className="rounded border border-gold-200 bg-white p-5 text-sm">
          <h2 className="font-serif text-xl text-sage-900">{k.link.studentName}</h2>
          <p className="mt-3 font-medium">{bn ? "কোর্স" : "Courses"}</p>
          {k.enrollments.length === 0 ? <p className="text-sage-700">{bn ? "এখনো ভর্তি হয়নি।" : "Not enrolled yet."}</p> : <ul className="list-disc pl-5">{k.enrollments.map((e) => <li key={e.id}>{titles[e.courseId] ?? e.courseId}</li>)}</ul>}
          <p className="mt-3 font-medium">{bn ? "উপস্থিতি" : "Attendance"}</p>
          <p className="text-sage-700">{Object.keys(k.attendance).length === 0 ? (bn ? "এখনো কিছু নেই।" : "Nothing yet.") : Object.entries(k.attendance).map(([a, n]) => `${attLabel(a)} ${n}`).join(" · ")}</p>
          <p className="mt-3 font-medium">{bn ? "হোমওয়ার্ক" : "Homework"}</p>
          {k.subs.length === 0 ? <p className="text-sage-700">{bn ? "এখনো জমা নেই।" : "No submissions yet."}</p> : <ul className="list-disc pl-5">{k.subs.map((s) => <li key={s.id}>{s.homeworkTitle || s.homeworkId} — {s.status}{s.grade && ` · ${s.grade}`}{s.feedback && ` · ${s.feedback}`}</li>)}</ul>}
          <p className="mt-3 font-medium">{bn ? "পেমেন্ট অনুরোধ" : "Payment requests"}</p>
          {k.payments.length === 0 ? <p className="text-sage-700">{bn ? "এখনো কিছু নেই।" : "Nothing yet."}</p> : <ul className="list-disc pl-5">{k.payments.map((p) => <li key={p.id}>{titles[p.courseId] ?? p.courseId} · {p.amount} {p.currency} — {st(p.status)}</li>)}</ul>}
        </section>))}
    </div>
  );
}
