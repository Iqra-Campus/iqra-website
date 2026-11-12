"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import AttendanceMarker from "@/components/AttendanceMarker";

type S = { id: string; courseId: string; title: string; startsAt: Timestamp; durationMin: number; meetingUrl: string; teacherId?: string; teacherName: string; notes: string; status: string };
const tzLabel = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

export default function SchedulePanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = useState<S[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mark, setMark] = useState<S | null>(null);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const [c, s, t] = await Promise.all([
        getDocs(collection(db, "courses")),
        getDocs(query(collection(db, "classSessions"), orderBy("startsAt", "desc"))),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
      ]);
      setCourses(c.docs.map((d) => ({ id: d.id, title: d.data().title?.en || d.id })));
      setTeachers(t.docs.map((d) => ({ id: d.id, name: d.data().displayName || d.data().email || d.id })));
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<S, "id">) })));
    } catch { setMsg("Could not load. Retry."); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const title = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const url = g("url");
    if (url && !url.startsWith("https://")) { setMsg("Meeting link must start with https://"); return; }
    const when = new Date(`${g("date")}T${g("time")}`);
    if (isNaN(when.getTime())) { setMsg("Choose a valid date and time."); return; }
    const teacher = teachers.find((t) => t.id === g("teacher"));
    setBusy(true); setMsg("");
    try {
      const db = getDb(); const b = writeBatch(db);
      const ref = doc(collection(db, "classSessions"));
      b.set(ref, {
        courseId: g("course"), title: g("title"), startsAt: Timestamp.fromDate(when), durationMin: Number(g("dur")) || 30,
        meetingUrl: url, teacherId: teacher?.id ?? "", teacherName: teacher?.name ?? "", notes: g("notes"), status: "scheduled", createdAt: serverTimestamp(),
      });
      if (teacher) b.set(doc(db, "courseTeachers", `${g("course")}_${teacher.id}`), { courseId: g("course"), teacherId: teacher.id, createdAt: serverTimestamp() });
      await b.commit();
      form.reset(); setMsg("Class scheduled."); await load();
    } catch { setMsg("Could not save. Nothing was scheduled."); }
    setBusy(false);
  }
  async function setStatus(id: string, status: string) {
    try { await updateDoc(doc(getDb(), "classSessions", id), { status }); await load(); } catch { setMsg("Update failed."); }
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this class permanently?")) return;
    try { await deleteDoc(doc(getDb(), "classSessions", id)); await load(); } catch { setMsg("Delete failed."); }
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2 text-sm";
  if (mark && user) return <AttendanceMarker session={mark} markerId={user.uid} onClose={(m) => { setMark(null); if (m) setMsg(m); }} />;
  return (
    <div>
      <form onSubmit={create} className="grid gap-3 rounded border border-gold-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm">Course<select name="course" required className={inp}><option value="">— choose —</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="text-sm">Class title<input name="title" required maxLength={120} className={inp} /></label>
        <label className="text-sm">Date<input name="date" type="date" required className={inp} /></label>
        <label className="text-sm">Time (your time zone: {tzLabel})<input name="time" type="time" required className={inp} /></label>
        <label className="text-sm">Duration (minutes)<input name="dur" type="number" min={10} max={300} defaultValue={30} className={inp} /></label>
        <label className="text-sm">Teacher<select name="teacher" className={inp}><option value="">— none —</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="text-sm sm:col-span-2">Meeting link (https://…)<input name="url" maxLength={300} className={inp} /></label>
        <label className="text-sm sm:col-span-2">Notes for students<textarea name="notes" rows={2} maxLength={500} className={inp} /></label>
        <button disabled={busy} className="rounded bg-sage-700 py-2 text-white disabled:opacity-60 sm:col-span-2">Schedule class</button>
      </form>
      {teachers.length === 0 && <p className="mt-2 text-xs text-sage-700">No teacher accounts yet. Create one under the Users tab (Super Admin).</p>}
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      <p className="mt-2 text-xs text-sage-700">Times are stored exactly and each person sees them in their own time zone.</p>
      <ul className="mt-3 space-y-2">{rows.map((s) => (
        <li key={s.id} className="rounded border border-gold-200 bg-white p-3 text-sm">
          <p><b>{s.title}</b> · {title(s.courseId)} · <i>{s.status}</i></p>
          <p>{s.startsAt.toDate().toLocaleString()} ({tzLabel}) · {s.durationMin} min{s.teacherName && ` · ${s.teacherName}`}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button onClick={() => setMark(s)} className="underline">Attendance</button>
            {s.status === "scheduled" && <button onClick={() => setStatus(s.id, "completed")} className="underline">Mark completed</button>}
            {s.status === "scheduled" && <button onClick={() => setStatus(s.id, "cancelled")} className="underline">Cancel</button>}
            <button onClick={() => remove(s.id)} className="text-red-700 underline">Delete</button>
          </div>
        </li>))}</ul>
    </div>
  );
}
