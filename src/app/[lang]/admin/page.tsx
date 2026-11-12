"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { downloadCsv } from "@/lib/csv";
import CertificatesPanel from "@/components/CertificatesPanel";
import HomeworkPanel from "@/components/HomeworkPanel";
import UsersPanel from "@/components/UsersPanel";
import SchedulePanel from "@/components/SchedulePanel";
import PaymentsPanel from "@/components/PaymentsPanel";
import ContentManager, { type Field } from "@/components/ContentManager";

type Booking = { id: string; name: string; email: string; phone: string; studentAge: number; country: string; courseId: string; preferredDate: string; preferredTime: string; timeZone: string; message?: string; status: string };
const modules: Record<string, { col: string; singletonId?: string; fields: Field[] }> = {
  Home: { col: "siteSettings", singletonId: "home", fields: [
    { key: "heroEyebrow", label: "Hero small title", bilingual: true }, { key: "heroTitle", label: "Hero headline", bilingual: true }, { key: "heroText", label: "Hero text", bilingual: true, multiline: true }] },
  About: { col: "pages", singletonId: "about", fields: [{ key: "body", label: "About Us text", bilingual: true, multiline: true }] },
  Pricing: { col: "pages", singletonId: "pricing", fields: [{ key: "body", label: "Pricing text", bilingual: true, multiline: true }] },
  Terms: { col: "pages", singletonId: "terms", fields: [{ key: "body", label: "Terms & Conditions text", bilingual: true, multiline: true }] },
  Privacy: { col: "pages", singletonId: "privacy", fields: [{ key: "body", label: "Privacy Policy text", bilingual: true, multiline: true }] },
  Refund: { col: "pages", singletonId: "refund", fields: [{ key: "body", label: "Refund Policy text", bilingual: true, multiline: true }] },
  Reviews: { col: "reviews", fields: [
    { key: "name", label: "Reviewer name" }, { key: "country", label: "Country" }, { key: "rating", label: "Rating (1-5)", number: true },
    { key: "text", label: "Review text", bilingual: true, multiline: true }, { key: "order", label: "Display order", number: true }] },
  Blog: { col: "blogPosts", fields: [
    { key: "title", label: "Title", bilingual: true }, { key: "summary", label: "Short summary", bilingual: true },
    { key: "body", label: "Article text", bilingual: true, multiline: true }, { key: "author", label: "Author name" }] },
  Announcements: { col: "announcements", fields: [
    { key: "title", label: "Headline", bilingual: true }, { key: "text", label: "Details", bilingual: true, multiline: true }] },
  Courses: { col: "courses", fields: [
    { key: "title", label: "Course title", bilingual: true }, { key: "description", label: "Description", bilingual: true, multiline: true },
    { key: "price", label: "Price text", bilingual: true }, { key: "order", label: "Display order", number: true }] },
  Teachers: { col: "teachers", fields: [
    { key: "name", label: "Name", bilingual: true }, { key: "qualifications", label: "Qualifications", bilingual: true }, { key: "bio", label: "Biography", bilingual: true, multiline: true }, { key: "order", label: "Display order", number: true }] },
  "Payment Methods": { col: "paymentMethods", fields: [
    { key: "name", label: "Method name (e.g. bKash, Bank)", bilingual: true }, { key: "accountNumber", label: "Account / number" }, { key: "accountName", label: "Account holder name" },
    { key: "bankName", label: "Bank name (if bank)" }, { key: "branch", label: "Branch (optional)" }, { key: "swift", label: "SWIFT / IBAN (optional)" },
    { key: "currency", label: "Currency (BDT, USD, EGP...)" }, { key: "instructions", label: "Instructions for students", bilingual: true, multiline: true }, { key: "order", label: "Display order", number: true }] },
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
        {["Bookings", "Payments", "Schedule", "Homework", "Certificates", "Users", ...Object.keys(modules)].map((n) => (
          <button key={n} onClick={() => setTab(n)} className={`rounded px-3 py-1 text-sm ${tab === n ? "bg-sage-700 text-white" : "border border-sage-300"}`}>{n}</button>
        ))}
      </div>
      {tab === "Payments" && <div className="mt-6"><PaymentsPanel /></div>}
      {tab === "Schedule" && <div className="mt-6"><SchedulePanel /></div>}
      {tab === "Users" && <div className="mt-6"><UsersPanel /></div>}
      {tab === "Certificates" && <div className="mt-6"><CertificatesPanel /></div>}
      {tab === "Homework" && user && <div className="mt-6"><HomeworkPanel userId={user.uid} isAdmin /></div>}
      {tab !== "Bookings" && tab !== "Payments" && tab !== "Schedule" && tab !== "Users" && tab !== "Homework" && tab !== "Certificates" && <div className="mt-6"><ContentManager key={tab} {...modules[tab]} /></div>}
      {tab === "Bookings" && <div className="mt-6 flex items-center gap-3"><h2 className="text-xl text-sage-900">Trial class bookings</h2><button onClick={() => downloadCsv("bookings.csv", rows as unknown as Record<string, unknown>[])} className="text-sm underline">Export CSV</button></div>}
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
