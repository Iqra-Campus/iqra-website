"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type Booking = { id: string; name: string; email: string; phone: string; studentAge: number; country: string; courseId: string; preferredDate: string; preferredTime: string; timeZone: string; message?: string; status: string };
const statuses = ["pending", "confirmed", "rescheduleRequested", "completed", "cancelled", "rejected"];

export default function Admin() {
  const { lang } = useParams<{ lang: string }>();
  const { user, profile, loading, configured } = useAuth();
  const [rows, setRows] = useState<Booking[]>([]);
  const [err, setErr] = useState("");
  const allowed = !!profile && profile.status === "active" && ["superAdmin", "admin"].includes(profile.role ?? "");

  const load = useCallback(async () => {
    setErr("");
    try {
      const s = await getDocs(query(collection(getDb(), "bookings"), orderBy("createdAt", "desc")));
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, "id">) })));
    } catch { setErr("Could not load bookings. Retry."); }
  }, []);
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  async function setStatus(id: string, status: string) {
    try { await updateDoc(doc(getDb(), "bookings", id), { status }); setRows((r) => r.map((b) => (b.id === id ? { ...b, status } : b))); }
    catch { setErr("Could not update the status. Nothing was saved."); }
  }

  if (!configured) return <p className="p-10 text-center">Firebase is not configured.</p>;
  if (loading) return <p className="p-10 text-center">Loading…</p>;
  if (!user) return <p className="p-10 text-center"><a className="underline" href={`/${lang}/login`}>Please sign in</a></p>;
  if (!allowed) return <p className="p-10 text-center">Access denied.</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl text-sage-900">Admin Dashboard</h1>
      <h2 className="mt-6 text-xl text-sage-900">Trial class bookings</h2>
      {err && <p role="alert" className="mt-3 text-red-700">{err} <button className="underline" onClick={load}>Retry</button></p>}
      {rows.length === 0 && !err ? <p className="mt-4 text-sage-700">No booking requests yet.</p> : (
        <div className="mt-4 space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="rounded border border-gold-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{b.name} · age {b.studentAge} · {b.country}</p>
                <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className="rounded border border-sage-300 px-2 py-1">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <p>{b.email} · {b.phone}</p>
              <p>{b.preferredDate} {b.preferredTime} ({b.timeZone}) · course: {b.courseId}</p>
              {b.message && <p className="mt-1 text-sage-700">{b.message}</p>}
              <p className="mt-1 text-xs text-sage-500">Ref: {b.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
