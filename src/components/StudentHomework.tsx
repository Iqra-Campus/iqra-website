"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

type H = { id: string; courseId: string; title: string; description: string; dueAt: Timestamp; status: string };
type Sub = { text: string; status: string; grade?: string; feedback?: string };
const T = {
  en: { h: "My homework", none: "No homework yet.", due: "Due", ans: "Your answer", submit: "Submit", resubmit: "Update answer", sub: "Submitted", rev: "Reviewed", grade: "Grade", fb: "Feedback", closed: "Closed", fail: "Could not submit. Please try again.", err: "Could not load homework." },
  bn: { h: "আমার হোমওয়ার্ক", none: "এখনো কোনো হোমওয়ার্ক নেই।", due: "জমার শেষ সময়", ans: "আপনার উত্তর", submit: "জমা দিন", resubmit: "উত্তর হালনাগাদ করুন", sub: "জমা হয়েছে", rev: "পরীক্ষিত", grade: "গ্রেড", fb: "মন্তব্য", closed: "বন্ধ", fail: "জমা দেওয়া যায়নি। আবার চেষ্টা করুন।", err: "হোমওয়ার্ক লোড করা যায়নি।" },
};

export default function StudentHomework({ lang, userId, userName, courseIds }: { lang: "en" | "bn"; userId: string; userName: string; courseIds: string[] }) {
  const t = T[lang] ?? T.en;
  const [rows, setRows] = useState<H[] | null>(null);
  const [subs, setSubs] = useState<Record<string, Sub>>({});
  const [msg, setMsg] = useState("");
  const key = courseIds.join(",");

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const lists = await Promise.all(courseIds.map((c) => getDocs(query(collection(db, "homework"), where("courseId", "==", c)))));
      setRows(lists.flatMap((l) => l.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<H, "id">) }))).sort((a, b) => a.dueAt.toMillis() - b.dueAt.toMillis()));
      const s = await getDocs(query(collection(db, "submissions"), where("userId", "==", userId)));
      const m: Record<string, Sub> = {}; s.docs.forEach((d) => { m[d.data().homeworkId] = d.data() as Sub; });
      setSubs(m);
    } catch { setMsg(t.err); setRows([]); }
  }, [key, userId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>, h: H) {
    e.preventDefault(); setMsg("");
    const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
    if (!text) return;
    try {
      await setDoc(doc(getDb(), "submissions", `${h.id}_${userId}`), { homeworkId: h.id, homeworkTitle: h.title, courseId: h.courseId, userId, userName, text, status: "submitted", submittedAt: serverTimestamp() });
      await load();
    } catch { setMsg(t.fail); }
  }

  if (courseIds.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-xl text-sage-900">{t.h}</h2>
      {msg && <p role="alert" className="mt-2 text-red-700">{msg}</p>}
      {rows === null ? <p className="mt-2">…</p> : rows.length === 0 ? <p className="mt-2 text-sage-700">{t.none}</p> : (
        <ul className="mt-2 space-y-3">{rows.map((h) => {
          const s = subs[h.id]; const canEdit = h.status === "active" && (!s || s.status === "submitted");
          return (
            <li key={h.id} className="rounded border border-sage-300 bg-white p-3 text-sm">
              <p><b>{h.title}</b> · {t.due}: {h.dueAt.toDate().toLocaleString()}{h.status !== "active" && ` · ${t.closed}`}</p>
              {h.description && <p className="mt-1 whitespace-pre-line text-sage-700">{h.description}</p>}
              {s && <p className="mt-2"><b>{s.status === "reviewed" ? t.rev : t.sub}</b>{s.grade && ` · ${t.grade}: ${s.grade}`}{s.feedback && ` · ${t.fb}: ${s.feedback}`}</p>}
              {canEdit && (
                <form onSubmit={(e) => submit(e, h)} className="mt-2">
                  <textarea key={s?.text} name="text" required rows={3} maxLength={5000} defaultValue={s?.text ?? ""} aria-label={t.ans} placeholder={t.ans} className="w-full rounded border border-sage-300 px-3 py-2" />
                  <button className="mt-2 rounded bg-sage-700 px-4 py-1 text-white">{s ? t.resubmit : t.submit}</button>
                </form>)}
            </li>);
        })}</ul>)}
    </section>
  );
}
