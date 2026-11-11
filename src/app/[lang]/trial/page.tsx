"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";

const L = {
  en: { title: "Book a Free Trial Class", name: "Parent / student name", email: "Email", phone: "Contact number", age: "Student age", country: "Country", course: "Course", general: "General inquiry / not sure yet", date: "Preferred date", time: "Preferred time", tz: "Time zone", msg: "Additional message (optional)", submit: "Send request", sending: "Sending…", ok: "Your request has been received. We will contact you to confirm; it is not confirmed yet.", fail: "We could not save your request. Please check your connection and try again.", nocfg: "Booking is not available yet. Please contact us directly." },
  bn: { title: "ফ্রি ট্রায়াল ক্লাস বুক করুন", name: "অভিভাবক / শিক্ষার্থীর নাম", email: "ইমেইল", phone: "যোগাযোগের নম্বর", age: "শিক্ষার্থীর বয়স", country: "দেশ", course: "কোর্স", general: "সাধারণ জিজ্ঞাসা / এখনো ঠিক করিনি", date: "পছন্দের তারিখ", time: "পছন্দের সময়", tz: "টাইম জোন", msg: "অতিরিক্ত বার্তা (ঐচ্ছিক)", submit: "অনুরোধ পাঠান", sending: "পাঠানো হচ্ছে…", ok: "আপনার অনুরোধ পাওয়া গেছে। আমরা যোগাযোগ করে নিশ্চিত করব; এখনো নিশ্চিত হয়নি।", fail: "অনুরোধ সংরক্ষণ করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।", nocfg: "বুকিং এখনো চালু হয়নি। সরাসরি যোগাযোগ করুন।" },
};
type Course = { id: string; title: string };

export default function Trial() {
  const { lang } = useParams<{ lang: "en" | "bn" }>();
  const t = L[lang] ?? L.en;
  const [courses, setCourses] = useState<Course[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  useEffect(() => {
    if (!firebaseConfigured) return;
    getDocs(query(collection(getDb(), "courses"), where("status", "==", "published")))
      .then((s) => setCourses(s.docs.map((d) => { const x = d.data(); return { id: d.id, title: x.title?.[lang] ?? x.title?.en ?? d.id }; })))
      .catch(() => setCourses([]));
  }, [lang]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const data: Record<string, unknown> = {
      name: get("name"), email: get("email"), phone: get("phone"), studentAge: parseInt(get("age"), 10),
      country: get("country"), courseId: get("course") || "general", preferredDate: get("date"), preferredTime: get("time"),
      timeZone: get("tz"), status: "pending", createdAt: serverTimestamp(),
    };
    if (get("msg")) data.message = get("msg");
    setState("sending");
    try { await addDoc(collection(getDb(), "bookings"), data); setState("ok"); } catch { setState("fail"); }
  }

  const input = "mt-1 w-full rounded border border-sage-300 bg-white px-3 py-2";
  if (!firebaseConfigured) return <p className="mx-auto my-16 max-w-md rounded border border-gold-200 bg-white p-6 text-center">{t.nocfg}</p>;
  if (state === "ok") return <p role="status" className="mx-auto my-16 max-w-md rounded border border-sage-300 bg-white p-6 text-center">{t.ok}</p>;
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{t.title}</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded border border-gold-200 bg-white p-6 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">{t.name}<input name="name" required minLength={2} maxLength={100} className={input} /></label>
        <label className="text-sm">{t.email}<input name="email" type="email" required maxLength={200} className={input} /></label>
        <label className="text-sm">{t.phone}<input name="phone" required minLength={5} maxLength={30} className={input} /></label>
        <label className="text-sm">{t.age}<input name="age" type="number" required min={3} max={100} className={input} /></label>
        <label className="text-sm">{t.country}<input name="country" required minLength={2} maxLength={80} className={input} /></label>
        <label className="text-sm sm:col-span-2">{t.course}
          <select name="course" className={input}><option value="general">{t.general}</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="text-sm">{t.date}<input name="date" type="date" required className={input} /></label>
        <label className="text-sm">{t.time}<input name="time" type="time" required className={input} /></label>
        <label className="text-sm sm:col-span-2">{t.tz}<input name="tz" required defaultValue={tz} className={input} /></label>
        <label className="text-sm sm:col-span-2">{t.msg}<textarea name="msg" maxLength={1000} rows={3} className={input} /></label>
        {state === "fail" && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{t.fail}</p>}
        <button disabled={state === "sending"} className="rounded bg-sage-700 py-3 font-medium text-white disabled:opacity-60 sm:col-span-2">{state === "sending" ? t.sending : t.submit}</button>
      </form>
    </div>
  );
}
