"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type U = { id: string; displayName?: string; email?: string; role?: string; status?: string };

export default function UsersPanel() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<U[]>([]);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const load = useCallback(async () => {
    try { const s = await getDocs(collection(getDb(), "users")); setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as U)); }
    catch { setMsg("Could not load users."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (profile?.role !== "superAdmin") return <p className="text-sage-700">Only the Super Admin can manage users.</p>;
  async function change(id: string, field: "role" | "status", value: string) {
    if (!window.confirm(`Change ${field} to "${value}"?`)) return;
    try { await updateDoc(doc(getDb(), "users", id), { [field]: value }); setMsg("Saved."); await load(); }
    catch { setMsg("Failed. Nothing was changed."); }
  }
  const shown = rows.filter((r) => `${r.displayName} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <p className="text-sm text-sage-700">To create a teacher: ask them to sign up on the site as a student, then change their role to <b>teacher</b> here.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="mt-3 w-full rounded border border-sage-300 px-3 py-2 text-sm" />
      {msg && <p role="status" className="mt-2 text-sm text-sage-700">{msg}</p>}
      <ul className="mt-3 space-y-2">{shown.map((u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold-200 bg-white p-3 text-sm">
          <span>{u.displayName || "—"} · {u.email}</span>
          {u.id === user?.uid || u.role === "superAdmin" ? <i>{u.role}</i> : (
            <span className="flex gap-2">
              <select value={u.role} onChange={(e) => change(u.id, "role", e.target.value)} className="rounded border border-sage-300 px-2 py-1">
                {["student", "teacher", "admin"].map((r) => <option key={r}>{r}</option>)}</select>
              <select value={u.status} onChange={(e) => change(u.id, "status", e.target.value)} className="rounded border border-sage-300 px-2 py-1">
                {["active", "suspended"].map((r) => <option key={r}>{r}</option>)}</select>
            </span>)}
        </li>))}</ul>
    </div>
  );
}
