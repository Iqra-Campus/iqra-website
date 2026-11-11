"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import ContentManager, { type Field } from "@/components/ContentManager";

type Booking = { id: string; name: string; email: string; phone: string; studentAge: number; country: string; courseId: string; preferredDate: string; preferredTime: string; timeZone: string; message?: string; status: string };
const modules: Record<string, { col: string; singletonId?: string; fields: Field[] }> = {
  Home: { col: "siteSettings", singletonId: "home", fields: [
    { key: "heroEyebrow", label: "Hero small title", bilingual: true }, { key: "heroTitle", label: "Hero headline", bilingual: true }, { key: "heroText", label: "Hero text", bilingual: true, multiline: true }] },
  Courses: { col: "courses", fields: [
    { key: "title", label: "Course title", bilingual: true }, { key: "description", label: "Description", bilingual: true, multiline: true },
    { key: "price", label: "Price text", bilingual: true }, { key: "order", label: "Display order", number: true }] },
  Teachers: { col: "teachers", fields: [
    { key: "name", label: "Name", bilingual: true }, { key: "qualifications", label: "Qualifications", bilingual: true }, { key: "bio", label: "Biography", bilingual: true, multiline: true }, { key: "order", label: "Display order", number: true }] },
  FAQs: { col: "faqs", fields: [
    { key: "question", label: "Question", bilingual: true }, { key: "answer", label: "Answer", bilingual: true, multiline: true }, { key: "order", label: "Display order", number: true }] },
};
const statuses = ["pending", "confirmed", "rescheduleRequested", "completed", "cancelled", "rejected"];

export default function Admin() {
  const { lang } = useParams<{ lang: string }>();
  const { user, profile, loading, configured } = useAuth();
  const [rows, setRows] = useState<Booking[]>([]);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("Bookings");
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
      <div className="mt-4 flex flex-wrap gap-2">
        {["Bookings", ...Object.keys(modules)].map((n) => (
          <button key={n} onClick={() => setTab(n)} className={`rounded px-3 py-1 text-sm ${tab === n ? "bg-sage-700 text-white" : "border border-sage-300"}`}>{n}</button>
        ))}
      </div>
      {tab !== "Bookings" && <div className="mt-6"><ContentManager key={tab} {...modules[tab]} /></div>}
      {tab === "Bookings" && <h2 className="mt-6 text-xl text-sage-900">Trial class bookings</h2>}
      {tab === "Bookings" && err && <p role="alert" className="mt-3 text-red-700">{err} <button className="underline" onClick={load}>Retry</button></p>}
      {tab === "Bookings" && (rows.length === 0 && !err ? <p className="mt-4 text-sage-700">No booking requests yet.</p> : (
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
      ))}
    </div>
  );
}
