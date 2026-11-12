"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, type Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

type S = { id: string; courseId: string; title: string; startsAt: Timestamp; durationMin: number; meetingUrl: string; teacherName: string; notes: string; status: string };
const T = {
  en: { h: "My upcoming classes", none: "No upcoming classes.", join: "Join class", att: "My attendance", present: "present", late: "late", absent: "absent", excused: "excused", err: "Could not load classes." },
  bn: { h: "আমার আসন্ন ক্লাস", none: "কোনো আসন্ন ক্লাস নেই।", join: "ক্লাসে যোগ দিন", att: "আমার উপস্থিতি", present: "উপস্থিত", late: "দেরিতে", absent: "অনুপস্থিত", excused: "অনুমোদিত ছুটি", err: "ক্লাস লোড করা যায়নি।" },
};

export default function StudentClasses({ lang, userId, courseIds, titles }: { lang: "en" | "bn"; userId: string; courseIds: string[]; titles: Record<string, string> }) {
  const t = T[lang] ?? T.en;
  const [rows, setRows] = useState<S[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [err, setErr] = useState(false);
  const key = courseIds.join(",");

  useEffect(() => {
    const db = getDb();
    (async () => {
      try {
        const lists = await Promise.all(courseIds.map((c) => getDocs(query(collection(db, "classSessions"), where("courseId", "==", c)))));
        const now = Date.now();
        const all = lists.flatMap((l) => l.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<S, "id">) })))
          .filter((s) => s.status === "scheduled" && s.startsAt.toMillis() + s.durationMin * 60000 >= now)
          .sort((a, b) => a.startsAt.toMillis() - b.startsAt.toMillis());
        setRows(all);
        const at = await getDocs(query(collection(db, "attendance"), where("userId", "==", userId)));
        const c: Record<string, number> = {}; at.docs.forEach((d) => { const s = d.data().status as string; c[s] = (c[s] ?? 0) + 1; });
        setCounts(c);
      } catch { setErr(true); setRows([]); }
    })();
  }, [key, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (courseIds.length === 0) return null;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <section>
      <h2 className="font-serif text-xl text-sage-900">{t.h}</h2>
      {err && <p role="alert" className="mt-2 text-red-700">{t.err}</p>}
      {rows === null ? <p className="mt-2">…</p> : rows.length === 0 ? <p className="mt-2 text-sage-700">{t.none}</p> : (
        <ul className="mt-2 space-y-2">{rows.map((s) => (
          <li key={s.id} className="rounded border border-sage-300 bg-white p-3 text-sm">
            <p><b>{s.title}</b> · {titles[s.courseId] ?? ""}</p>
            <p>{s.startsAt.toDate().toLocaleString()} ({tz}) · {s.durationMin} min{s.teacherName && ` · ${s.teacherName}`}</p>
            {s.notes && <p className="text-sage-700">{s.notes}</p>}
            {s.meetingUrl && <a className="mt-1 inline-block rounded bg-sage-700 px-3 py-1 text-white" href={s.meetingUrl} target="_blank" rel="noopener noreferrer">{t.join}</a>}
          </li>))}</ul>)}
      {Object.keys(counts).length > 0 && <p className="mt-3 text-sm text-sage-700">{t.att}: {(["present", "late", "absent", "excused"] as const).filter((k) => counts[k]).map((k) => `${t[k]} ${counts[k]}`).join(" · ")}</p>}
    </section>
  );
}
