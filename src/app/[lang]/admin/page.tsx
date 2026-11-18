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
import { defaultPages } from "@/content/defaults";
import SchedulePanel from "@/components/SchedulePanel";
import PaymentsPanel from "@/components/PaymentsPanel";
import ContentManager, { type Field, type Seed } from "@/components/ContentManager";
import { starterCourses } from "@/content/courses";

type Booking = { id: string; name: string; email: string; phone: string; studentAge: number; country: string; courseId: string; preferredDate: string; preferredTime: string; timeZone: string; message?: string; status: string };
const modules: Record<string, { col: string; singletonId?: string; fields: Field[]; prefill?: Record<string, { en: string; bn: string }>; idField?: string; seed?: Seed }> = {
  Home: { col: "siteSettings", singletonId: "home", fields: [
    { key: "heroEyebrow", label: "Hero small title", bilingual: true }, { key: "heroTitle", label: "Hero headline", bilingual: true }, { key: "heroText", label: "Hero text", bilingual: true, multiline: true }] },
  About: { col: "pages", singletonId: "about", prefill: { body: defaultPages.about }, fields: [{ key: "body", label: "About Us text", bilingual: true, multiline: true }] },
  Pricing: { col: "pages", singletonId: "pricing", fields: [{ key: "body", label: "Pricing text", bilingual: true, multiline: true }] },
  Terms: { col: "pages", singletonId: "terms", prefill: { body: defaultPages.terms }, fields: [{ key: "body", label: "Terms & Conditions text", bilingual: true, multiline: true }] },
  Privacy: { col: "pages", singletonId: "privacy", prefill: { body: defaultPages.privacy }, fields: [{ key: "body", label: "Privacy Policy text", bilingual: true, multiline: true }] },
  Refund: { col: "pages", singletonId: "refund", prefill: { body: defaultPages.refund }, fields: [{ key: "body", label: "Refund Policy text", bilingual: true, multiline: true }] },
  Reviews: { col: "reviews", fields: [
    { key: "name", label: "Reviewer name" }, { key: "country", label: "Country" }, { key: "rating", label: "Rating (1-5)", number: true },
    { key: "text", label: "Review text", bilingual: true, multiline: true }, { key: "teacherIds", label: "Show on these teachers' profiles (optional)", picks: "teachers" }, { key: "order", label: "Display order", number: true }] },
  Blog: { col: "blogPosts", fields: [
    { key: "title", label: "Title", bilingual: true }, { key: "summary", label: "Short summary", bilingual: true },
    { key: "body", label: "Article text", bilingual: true, multiline: true }, { key: "author", label: "Author name" }] },
  Announcements: { col: "announcements", fields: [
    { key: "title", label: "Headline", bilingual: true }, { key: "text", label: "Details", bilingual: true, multiline: true }] },
  Courses: { col: "courses", idField: "slug", seed: starterCourses.map((c) => ({ id: c.id, data: c.data as unknown as Record<string, unknown> })), fields: [
    { key: "slug", label: "Web address name (letters, numbers, hyphens; cannot be changed later)", help: "Example: quran-reading  →  /en/courses/quran-reading" },
    { key: "photo", label: "Course photo (landscape works best; it is cropped to 16:9)", image: true, wide: true },
    { key: "title", label: "Course name", bilingual: true },
    { key: "tag", label: "Short tag (e.g. Ages 4–12)", bilingual: true },
    { key: "description", label: "Short description (shown on cards)", bilingual: true, multiline: true },
    { key: "audience", label: "Who is this course for?", bilingual: true, multiline: true },
    { key: "topics", label: "What will be taught", bilingual: true, multiline: true, help: "One item per line." },
    { key: "outcomes", label: "Objectives and learning outcomes", bilingual: true, multiline: true, help: "One item per line." },
    { key: "format", label: "How classes are held", bilingual: true, multiline: true },
    { key: "groupType", label: "One student or a group?", bilingual: true },
    { key: "schedule", label: "Class time and duration", bilingual: true, multiline: true },
    { key: "price", label: "Course fee", bilingual: true },
    { key: "teacherIds", label: "Teachers of this course", picks: "teachers" },
    { key: "faqText", label: "Questions and answers for this course", bilingual: true, multiline: true, help: "For each question: the question on the first line, the answer on the next lines. Leave a blank line between questions." },
    { key: "order", label: "Display order (1 shows first)", number: true }] },
  Teachers: { col: "teachers", idField: "slug", fields: [
    { key: "slug", label: "Web address name (letters, numbers, hyphens; cannot be changed later)", help: "Example: ustadh-ahmad  →  /en/teachers/ustadh-ahmad" },
    { key: "photo", label: "Photo (square works best)", image: true },
    { key: "name", label: "Name", bilingual: true },
    { key: "qualifications", label: "Short title (shown on cards, e.g. Qur'an & Tajweed)", bilingual: true },
    { key: "bio", label: "Short introduction", bilingual: true, multiline: true },
    { key: "education", label: "Education and certificates", bilingual: true, multiline: true, help: "One item per line." },
    { key: "expertise", label: "Areas of expertise (Quran, Tajweed, Hifz, Arabic...)", bilingual: true, multiline: true, help: "One item per line." },
    { key: "experience", label: "Teaching experience", bilingual: true, multiline: true },
    { key: "languages", label: "Languages taught in", bilingual: true },
    { key: "ages", label: "Age groups taught", bilingual: true },
    { key: "videoUrl", label: "Introduction video (YouTube link, optional)" },
    { key: "order", label: "Display order (1 shows first)", number: true }] },
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
