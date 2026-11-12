"use client";
import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type S = { id: string; courseId: string; title: string; startsAt: Timestamp; durationMin: number; meetingUrl: string; teacherName: string; notes: string; status: string };
type Stu = { id: string; name: string };
const marks = ["present", "late", "absent", "excused"];
const tzLabel = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

export default function SchedulePanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [rows, setRows] = useState<S[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [mark, setMark] = useState<{ s: S; students: Stu[]; att: Record<string, string> } | null>(null);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const [c, s] = await Promise.all([getDocs(collection(db, "courses")), getDocs(query(collection(db, "classSessions"), orderBy("startsAt", "desc")))]);
      setCourses(c.docs.map((d) => ({ id: d.id, title: d.data().title?.en || d.id })));
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<S, "id">) })));
    } catch { setMsg("Could not load. Retry."); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const title = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const url = g("url");
    if (url && !url.startsWith("https://")) { setMsg("Meeting link must start with https://"); return; }
    const when = new Date(`${g("date")}T${g("time")}`);
    if (isNaN(when.getTime())) { setMsg("Choose a valid date and time."); return; }
    setBusy(true); setMsg("");
    try {
      await addDoc(collection(getDb(), "classSessions"), {
        courseId: g("course"), title: g("title"), startsAt: Timestamp.fromDate(when), durationMin: Number(g("dur")) || 30,
        meetingUrl: url, teacherName: g("teacher"), notes: g("notes"), status: "scheduled", createdAt: serverTimestamp(),
      });
      (e.target as HTMLFormElement).reset(); setMsg("Class scheduled."); await load();
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
  async function openMark(s: S) {
    setMsg("");
    try {
      const db = getDb();
      const en = await getDocs(query(collection(db, "enrollments"), where("courseId", "==", s.courseId), where("status", "==", "active")));
      const students: Stu[] = await Promise.all(en.docs.map(async (d) => {
        const uid = d.data().userId as string;
        const u = await getDoc(doc(db, "users", uid));
        return { id: uid, name: (u.exists() && (u.data().displayName || u.data().email)) || uid };
      }));
      const at = await getDocs(query(collection(db, "attendance"), where("sessionId", "==", s.id)));
      const att: Record<string, string> = {}; at.docs.forEach((d) => { att[d.data().userId] = d.data().status; });
      setMark({ s, students, att });
    } catch { setMsg("Could not load students."); }
  }
  async function saveMarks() {
    if (!mark || !user) return;
    setBusy(true);
    try {
      const db = getDb(); const b = writeBatch(db);
      for (const st of mark.students) {
        const status = mark.att[st.id]; if (!status) continue;
        b.set(doc(db, "attendance", `${mark.s.id}_${st.id}`), { sessionId: mark.s.id, userId: st.id, courseId: mark.s.courseId, status, markedBy: user.uid, updatedAt: serverTimestamp() });
      }
      await b.commit(); setMsg("Attendance saved."); setMark(null);
    } catch { setMsg("Could not save attendance. Nothing was saved."); }
    setBusy(false);
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2 text-sm";
  if (mark) return (
    <div className="rounded border border-gold-200 bg-white p-4 text-sm">
      <p className="font-medium">Attendance: {mark.s.title} ({title(mark.s.courseId)})</p>
      {mark.students.length === 0 ? <p className="mt-2 text-sage-700">No enrolled students in this course yet.</p> : (
        <ul className="mt-3 space-y-2">{mark.students.map((st) => (
          <li key={st.id} className="flex items-center justify-between gap-2"><span>{st.name}</span>
            <select value={mark.att[st.id] ?? ""} onChange={(e) => setMark({ ...mark, att: { ...mark.att, [st.id]: e.target.value } })} className="rounded border border-sage-300 px-2 py-1">
              <option value="">—</option>{marks.map((m) => <option key={m}>{m}</option>)}</select></li>))}</ul>)}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} onClick={saveMarks} className="rounded bg-sage-700 px-4 py-2 text-white disabled:opacity-60">Save attendance</button>
        <button onClick={() => setMark(null)} className="rounded border border-sage-300 px-4 py-2">Back</button></div>
    </div>
  );
  return (
    <div>
      <form onSubmit={create} className="grid gap-3 rounded border border-gold-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm">Course<select name="course" required className={inp}><option value="">— choose —</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="text-sm">Class title<input name="title" required maxLength={120} className={inp} /></label>
        <label className="text-sm">Date<input name="date" type="date" required className={inp} /></label>
        <label className="text-sm">Time (your time zone: {tzLabel})<input name="time" type="time" required className={inp} /></label>
        <label className="text-sm">Duration (minutes)<input name="dur" type="number" min={10} max={300} defaultValue={30} className={inp} /></label>
        <label className="text-sm">Teacher name<input name="teacher" maxLength={100} className={inp} /></label>
        <label className="text-sm sm:col-span-2">Meeting link (https://…)<input name="url" maxLength={300} className={inp} /></label>
        <label className="text-sm sm:col-span-2">Notes for students<textarea name="notes" rows={2} maxLength={500} className={inp} /></label>
        <button disabled={busy} className="rounded bg-sage-700 py-2 text-white disabled:opacity-60 sm:col-span-2">Schedule class</button>
      </form>
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      <p className="mt-2 text-xs text-sage-700">Times are stored exactly and each student sees them in their own time zone.</p>
      <ul className="mt-3 space-y-2">{rows.map((s) => (
        <li key={s.id} className="rounded border border-gold-200 bg-white p-3 text-sm">
          <p><b>{s.title}</b> · {title(s.courseId)} · <i>{s.status}</i></p>
          <p>{s.startsAt.toDate().toLocaleString()} ({tzLabel}) · {s.durationMin} min{s.teacherName && ` · ${s.teacherName}`}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button onClick={() => openMark(s)} className="underline">Attendance</button>
            {s.status === "scheduled" && <button onClick={() => setStatus(s.id, "completed")} className="underline">Mark completed</button>}
            {s.status === "scheduled" && <button onClick={() => setStatus(s.id, "cancelled")} className="underline">Cancel</button>}
            <button onClick={() => remove(s.id)} className="text-red-700 underline">Delete</button>
          </div>
        </li>))}</ul>
    </div>
  );
}
