"use client";
import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

type H = { id: string; courseId: string; title: string; description: string; dueAt: Timestamp; status: string };
type Sub = { id: string; userId: string; userName: string; text: string; status: string; grade?: string; feedback?: string };

export default function HomeworkPanel({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [rows, setRows] = useState<H[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<{ h: H; subs: Sub[]; edit: Record<string, { grade: string; feedback: string }> } | null>(null);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      let ids: string[]; let cs: { id: string; title: string }[];
      if (isAdmin) {
        const c = await getDocs(collection(db, "courses"));
        cs = c.docs.map((d) => ({ id: d.id, title: d.data().title?.en || d.id })); ids = cs.map((x) => x.id);
      } else {
        const ct = await getDocs(query(collection(db, "courseTeachers"), where("teacherId", "==", userId)));
        ids = ct.docs.map((d) => d.data().courseId as string);
        const pub = await getDocs(query(collection(db, "courses"), where("status", "==", "published")));
        const names = new Map(pub.docs.map((d) => [d.id, d.data().title?.en || d.id]));
        cs = ids.map((id) => ({ id, title: (names.get(id) as string) || id }));
      }
      setCourses(cs);
      const lists = await Promise.all(ids.map((c) => getDocs(query(collection(db, "homework"), where("courseId", "==", c)))));
      setRows(lists.flatMap((l) => l.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<H, "id">) }))).sort((a, b) => b.dueAt.toMillis() - a.dueAt.toMillis()));
    } catch { setMsg("Could not load homework."); }
  }, [isAdmin, userId]);
  useEffect(() => { load(); }, [load]);
  const title = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const due = new Date(`${g("date")}T${g("time") || "23:59"}`);
    if (isNaN(due.getTime())) { setMsg("Choose a valid due date."); return; }
    setBusy(true); setMsg("");
    try {
      await addDoc(collection(getDb(), "homework"), { courseId: g("course"), title: g("title"), description: g("desc"), dueAt: Timestamp.fromDate(due), createdBy: userId, status: "active", createdAt: serverTimestamp() });
      form.reset(); setMsg("Homework created."); await load();
    } catch { setMsg("Could not save. Nothing was created."); }
    setBusy(false);
  }
  async function toggle(h: H) {
    try { await updateDoc(doc(getDb(), "homework", h.id), { status: h.status === "active" ? "closed" : "active" }); await load(); } catch { setMsg("Update failed."); }
  }
  async function openSubs(h: H) {
    try {
      const s = await getDocs(query(collection(getDb(), "submissions"), where("homeworkId", "==", h.id), where("courseId", "==", h.courseId)));
      const subs = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sub, "id">) }));
      const edit: Record<string, { grade: string; feedback: string }> = {};
      subs.forEach((x) => { edit[x.id] = { grade: x.grade ?? "", feedback: x.feedback ?? "" }; });
      setView({ h, subs, edit });
    } catch { setMsg("Could not load submissions."); }
  }
  async function review(sub: Sub) {
    if (!view) return;
    const e = view.edit[sub.id];
    try {
      await updateDoc(doc(getDb(), "submissions", sub.id), { status: "reviewed", grade: e.grade.trim(), feedback: e.feedback.trim(), reviewedBy: userId, reviewedAt: serverTimestamp() });
      setMsg("Saved."); await openSubs(view.h);
    } catch { setMsg("Could not save the review."); }
  }

  const inp = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2 text-sm";
  if (view) return (
    <div>
      <button onClick={() => setView(null)} className="text-sm underline">← Back</button>
      <h3 className="mt-2 font-medium">{view.h.title} · {title(view.h.courseId)}</h3>
      {msg && <p role="status" className="mt-1 text-sm text-sage-700">{msg}</p>}
      {view.subs.length === 0 ? <p className="mt-3 text-sage-700">No submissions yet.</p> : (
        <ul className="mt-3 space-y-3">{view.subs.map((s) => (
          <li key={s.id} className="rounded border border-gold-200 bg-white p-3 text-sm">
            <p className="font-medium">{s.userName} · <i>{s.status}</i></p>
            <p className="mt-1 whitespace-pre-line">{s.text}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label>Grade<input maxLength={20} value={view.edit[s.id]?.grade ?? ""} onChange={(e) => setView({ ...view, edit: { ...view.edit, [s.id]: { ...view.edit[s.id], grade: e.target.value } } })} className={inp} /></label>
              <label className="sm:col-span-2">Feedback<input maxLength={1000} value={view.edit[s.id]?.feedback ?? ""} onChange={(e) => setView({ ...view, edit: { ...view.edit, [s.id]: { ...view.edit[s.id], feedback: e.target.value } } })} className={inp} /></label>
            </div>
            <button onClick={() => review(s)} className="mt-2 rounded bg-sage-700 px-3 py-1 text-white">Save review</button>
          </li>))}</ul>)}
    </div>
  );
  return (
    <div>
      {courses.length === 0 ? <p className="text-sage-700">No courses available for homework yet.</p> : (
        <form onSubmit={create} className="grid gap-3 rounded border border-gold-200 bg-white p-4 sm:grid-cols-2">
          <label className="text-sm">Course<select name="course" required className={inp}><option value="">— choose —</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
          <label className="text-sm">Title<input name="title" required maxLength={120} className={inp} /></label>
          <label className="text-sm">Due date<input name="date" type="date" required className={inp} /></label>
          <label className="text-sm">Due time<input name="time" type="time" defaultValue="23:59" className={inp} /></label>
          <label className="text-sm sm:col-span-2">Instructions<textarea name="desc" rows={3} maxLength={3000} className={inp} /></label>
          <button disabled={busy} className="rounded bg-sage-700 py-2 text-white disabled:opacity-60 sm:col-span-2">Create homework</button>
        </form>)}
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      <ul className="mt-3 space-y-2">{rows.map((h) => (
        <li key={h.id} className="rounded border border-gold-200 bg-white p-3 text-sm">
          <p><b>{h.title}</b> · {title(h.courseId)} · <i>{h.status}</i></p>
          <p>Due: {h.dueAt.toDate().toLocaleString()}</p>
          <div className="mt-2 flex gap-3"><button onClick={() => openSubs(h)} className="underline">Submissions</button><button onClick={() => toggle(h)} className="underline">{h.status === "active" ? "Close" : "Reopen"}</button></div>
        </li>))}</ul>
    </div>
  );
}
