"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type C = { id: string; title: { en: string; bn: string } };
type Cert = { id: string; userId: string; courseId: string; userName: string; status: string };
type Stu = { userId: string; name: string };
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return "IQ" + Array.from(b, (x) => ALPHA[x % ALPHA.length]).join(""); };

export default function CertificatesPanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<C[]>([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState<Stu[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [msg, setMsg] = useState("");

  const loadCerts = useCallback(async () => {
    try { const s = await getDocs(collection(getDb(), "certificates")); setCerts(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Cert)); }
    catch { setMsg("Could not load certificates."); }
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const c = await getDocs(collection(getDb(), "courses"));
        setCourses(c.docs.map((d) => ({ id: d.id, title: { en: d.data().title?.en || d.id, bn: d.data().title?.bn || d.data().title?.en || d.id } })));
      } catch { setMsg("Could not load courses."); }
      loadCerts();
    })();
  }, [loadCerts]);
  useEffect(() => {
    if (!courseId) { setStudents([]); return; }
    getDocs(query(collection(getDb(), "enrollments"), where("courseId", "==", courseId), where("status", "==", "active")))
      .then((s) => setStudents(s.docs.map((d) => ({ userId: d.data().userId as string, name: (d.data().userName as string) || (d.data().userId as string) }))))
      .catch(() => setMsg("Could not load students."));
  }, [courseId]);

  async function issue(s: Stu) {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !user) return;
    if (!window.confirm(`Issue a certificate to ${s.name} for "${course.title.en}"?`)) return;
    try {
      await setDoc(doc(getDb(), "certificates", newCode()), {
        userId: s.userId, userName: s.name, courseId, courseTitleEn: course.title.en, courseTitleBn: course.title.bn,
        status: "active", issuedBy: user.uid, issuedAt: serverTimestamp(),
      });
      setMsg("Certificate issued."); await loadCerts();
    } catch { setMsg("Could not issue. Nothing was saved."); }
  }
  async function setStatus(id: string, status: string) {
    if (!window.confirm(status === "revoked" ? "Revoke this certificate? Verification will show it as revoked." : "Restore this certificate?")) return;
    try { await updateDoc(doc(getDb(), "certificates", id), { status }); await loadCerts(); } catch { setMsg("Failed."); }
  }
  const issued = (uid: string) => certs.find((c) => c.userId === uid && c.courseId === courseId && c.status === "active");

  return (
    <div>
      {msg && <p role="status" className="mb-2 text-sm text-sage-700">{msg}</p>}
      <label className="text-sm">Course
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 block w-full rounded border border-sage-300 bg-white px-3 py-2">
          <option value="">— choose —</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title.en}</option>)}</select></label>
      {courseId && (students.length === 0 ? <p className="mt-3 text-sage-700">No enrolled students in this course.</p> : (
        <ul className="mt-3 space-y-2">{students.map((s) => { const c = issued(s.userId); return (
          <li key={s.userId} className="flex items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
            <span>{s.name}{c && <i className="ml-2 text-sage-700">Code: {c.id}</i>}</span>
            {c ? <span className="text-sage-700">Issued</span> : <button onClick={() => issue(s)} className="rounded bg-sage-700 px-3 py-1 text-white">Issue certificate</button>}
          </li>); })}</ul>))}
      <h3 className="mt-8 font-medium">All certificates</h3>
      {certs.length === 0 ? <p className="mt-2 text-sage-700">None issued yet.</p> : (
        <ul className="mt-2 space-y-2">{certs.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
            <span>{c.userName} · {c.id} · <i>{c.status}</i></span>
            <button onClick={() => setStatus(c.id, c.status === "active" ? "revoked" : "active")} className="underline">{c.status === "active" ? "Revoke" : "Restore"}</button>
          </li>))}</ul>)}
    </div>
  );
}
