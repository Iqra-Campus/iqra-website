"use client";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const marks = ["present", "late", "absent", "excused"];
type Stu = { id: string; name: string };

export default function AttendanceMarker({ session, markerId, onClose }: { session: { id: string; courseId: string; title: string }; markerId: string; onClose: (msg?: string) => void }) {
  const [students, setStudents] = useState<Stu[] | null>(null);
  const [att, setAtt] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = getDb();
        const en = await getDocs(query(collection(db, "enrollments"), where("courseId", "==", session.courseId), where("status", "==", "active")));
        setStudents(en.docs.map((d) => ({ id: d.data().userId as string, name: (d.data().userName as string) || (d.data().userId as string) })));
        const at = await getDocs(query(collection(db, "attendance"), where("sessionId", "==", session.id), where("courseId", "==", session.courseId)));
        const m: Record<string, string> = {}; at.docs.forEach((d) => { m[d.data().userId] = d.data().status; });
        setAtt(m);
      } catch { setMsg("Could not load students."); setStudents([]); }
    })();
  }, [session.id, session.courseId]);

  async function save() {
    if (!students) return;
    setBusy(true); setMsg("");
    try {
      const db = getDb(); const b = writeBatch(db);
      for (const s of students) {
        if (!att[s.id]) continue;
        b.set(doc(db, "attendance", `${session.id}_${s.id}`), { sessionId: session.id, userId: s.id, courseId: session.courseId, status: att[s.id], markedBy: markerId, updatedAt: serverTimestamp() });
      }
      await b.commit(); onClose("Attendance saved.");
    } catch { setMsg("Could not save attendance. Nothing was saved."); }
    setBusy(false);
  }

  return (
    <div className="rounded border border-gold-200 bg-white p-4 text-sm">
      <p className="font-medium">Attendance: {session.title}</p>
      {students === null ? <p className="mt-2">…</p> : students.length === 0 ? <p className="mt-2 text-sage-700">No enrolled students in this course yet.</p> : (
        <ul className="mt-3 space-y-2">{students.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2"><span>{s.name}</span>
            <select value={att[s.id] ?? ""} onChange={(e) => setAtt({ ...att, [s.id]: e.target.value })} className="rounded border border-sage-300 px-2 py-1">
              <option value="">—</option>{marks.map((m) => <option key={m}>{m}</option>)}</select></li>))}</ul>)}
      {msg && <p role="alert" className="mt-2 text-red-700">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy || !students?.length} onClick={save} className="rounded bg-sage-700 px-4 py-2 text-white disabled:opacity-60">Save attendance</button>
        <button onClick={() => onClose()} className="rounded border border-sage-300 px-4 py-2">Back</button>
      </div>
    </div>
  );
}
