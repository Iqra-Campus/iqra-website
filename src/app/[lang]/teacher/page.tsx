"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import HomeworkPanel from "@/components/HomeworkPanel";
import AttendanceMarker from "@/components/AttendanceMarker";

type S = { id: string; courseId: string; title: string; startsAt: Timestamp; durationMin: number; meetingUrl: string; notes: string; status: string };

export default function Teacher() {
  const { lang } = useParams<{ lang: string }>();
  const { user, profile, loading, configured } = useAuth();
  const [rows, setRows] = useState<S[]>([]);
  const [mark, setMark] = useState<S | null>(null);
  const [msg, setMsg] = useState("");
  const allowed = !!profile && profile.status === "active" && profile.role === "teacher";
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const s = await getDocs(query(collection(getDb(), "classSessions"), where("teacherId", "==", user.uid)));
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<S, "id">) })).sort((a, b) => b.startsAt.toMillis() - a.startsAt.toMillis()));
    } catch { setMsg("Could not load your classes."); }
  }, [user]);
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  async function complete(id: string) {
    try { await updateDoc(doc(getDb(), "classSessions", id), { status: "completed" }); await load(); } catch { setMsg("Could not update."); }
  }

  if (!configured) return <p className="p-10 text-center">Not available yet.</p>;
  if (loading) return <p className="p-10 text-center">…</p>;
  if (!user) return <p className="p-10 text-center"><a className="underline" href={`/${lang}/login`}>Please sign in</a></p>;
  if (!allowed) return <p className="p-10 text-center">Access denied. This page is for teachers.</p>;
  if (mark) return <div className="mx-auto max-w-3xl px-4 py-10"><AttendanceMarker session={mark} markerId={user.uid} onClose={(m) => { setMark(null); if (m) setMsg(m); }} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl text-sage-900">Teacher Portal</h1>
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      {rows.length === 0 ? <p className="mt-4 text-sage-700">No classes assigned to you yet.</p> : (
        <ul className="mt-4 space-y-2">{rows.map((s) => (
          <li key={s.id} className="rounded border border-gold-200 bg-white p-3 text-sm">
            <p><b>{s.title}</b> · <i>{s.status}</i></p>
            <p>{s.startsAt.toDate().toLocaleString()} ({tz}) · {s.durationMin} min</p>
            {s.notes && <p className="text-sage-700">{s.notes}</p>}
            <div className="mt-2 flex flex-wrap gap-3">
              {s.meetingUrl && <a className="underline" href={s.meetingUrl} target="_blank" rel="noopener noreferrer">Open class link</a>}
              <button onClick={() => setMark(s)} className="underline">Attendance</button>
              {s.status === "scheduled" && <button onClick={() => complete(s.id)} className="underline">Mark completed</button>}
            </div>
          </li>))}</ul>)}
      <h2 className="mt-10 font-serif text-2xl text-sage-900">Homework</h2>
      <div className="mt-3"><HomeworkPanel userId={user.uid} isAdmin={false} /></div>
    </div>
  );
}
