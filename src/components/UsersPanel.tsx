"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type Link = { id: string; parentId: string; studentId: string; studentName: string };
type U = { id: string; displayName?: string; email?: string; role?: string; status?: string };

export default function UsersPanel() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([getDocs(collection(getDb(), "users")), getDocs(collection(getDb(), "parentLinks"))]);
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as U));
      setLinks(l.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Link));
    }
    catch { setMsg("Could not load users."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (profile?.role !== "superAdmin") return <p className="text-sage-700">Only the Super Admin can manage users.</p>;
  async function change(id: string, field: "role" | "status", value: string) {
    if (!window.confirm(`Change ${field} to "${value}"?`)) return;
    try { await updateDoc(doc(getDb(), "users", id), { [field]: value }); setMsg("Saved."); await load(); }
    catch { setMsg("Failed. Nothing was changed."); }
  }
  async function link(parentId: string, email: string) {
    const e = email.trim().toLowerCase();
    if (!e) return;
    try {
      const f = await getDocs(query(collection(getDb(), "users"), where("email", "==", e)));
      const st = f.docs.find((d) => d.data().role === "student");
      if (!st) { setMsg("No student account with that email."); return; }
      await setDoc(doc(getDb(), "parentLinks", `${parentId}_${st.id}`), { parentId, studentId: st.id, studentName: st.data().displayName || e, createdAt: serverTimestamp() });
      setMsg("Child linked."); await load();
    } catch { setMsg("Could not link. Nothing was saved."); }
  }
  async function unlink(id: string) {
    if (!window.confirm("Remove this link?")) return;
    try { await deleteDoc(doc(getDb(), "parentLinks", id)); await load(); } catch { setMsg("Failed."); }
  }
  const shown = rows.filter((r) => `${r.displayName} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <p className="text-sm text-sage-700">To create a teacher: ask them to sign up on the site as a student, then change their role to <b>teacher</b> here. For a parent: change the role to <b>parent</b>, then link their child by the child's student email.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="mt-3 w-full rounded border border-sage-300 px-3 py-2 text-sm" />
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      <ul className="mt-3 space-y-2">{shown.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
          <span>{u.displayName || "—"} · {u.email}</span>
          {u.id === user?.uid || u.role === "superAdmin" ? <i>{u.role}</i> : (
            <span className="flex gap-2">
              <select value={u.role} onChange={(e) => change(u.id, "role", e.target.value)} className="rounded border border-sage-300 px-2 py-1">
                {["student", "teacher", "parent", "admin"].map((r) => <option key={r}>{r}</option>)}</select>
              <select value={u.status} onChange={(e) => change(u.id, "status", e.target.value)} className="rounded border border-sage-300 px-2 py-1">
                {["active", "suspended"].map((r) => <option key={r}>{r}</option>)}</select>
            </span>)}
          {u.role === "parent" && (
            <div className="w-full border-t border-gold-200 pt-2">
              {links.filter((l) => l.parentId === u.id).map((l) => <p key={l.id}>Child: {l.studentName} <button onClick={() => unlink(l.id)} className="ml-2 text-red-700 underline">remove</button></p>)}
              <form onSubmit={(e) => { e.preventDefault(); const i = e.currentTarget.elements.namedItem("em") as HTMLInputElement; link(u.id, i.value); i.value = ""; }} className="mt-1 flex gap-2">
                <input name="em" placeholder="Child's student email" className="flex-1 rounded border border-sage-300 px-2 py-1" />
                <button className="rounded border border-sage-300 px-3">Link child</button>
              </form>
            </div>)}
        </li>))}</ul>
    </div>
  );
}
