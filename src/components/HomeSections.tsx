"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
const tx = (d: D, k: string, lang: Locale) => (d[k]?.[lang] || d[k]?.en || "") as string;

const T = {
  en: {
    why: "Why IQRA CAMPUS",
    features: [
      ["Live online classes", "Learn with qualified teachers from wherever you are."],
      ["Free trial class", "Experience our teaching before you enrol."],
      ["Track progress", "Classes, attendance, homework and teacher feedback in your account."],
      ["Parent view", "Parents can follow their child's progress."],
      ["Verified certificates", "Completion certificates anyone can verify online."],
      ["English & Bangla", "The whole website is available in both languages."],
    ],
    courses: "Our courses", all: "See all courses", enroll: "Enroll / Pay",
    reviews: "What students say", ctaTitle: "Ready to begin?", ctaText: "Book a free trial class and our team will contact you.", cta: "Free Trial Class",
  },
  bn: {
    why: "কেন ইকরা ক্যাম্পাস",
    features: [
      ["সরাসরি অনলাইন ক্লাস", "যেখানেই থাকুন, যোগ্য শিক্ষকদের সাথে শিখুন।"],
      ["ফ্রি ট্রায়াল ক্লাস", "ভর্তির আগে আমাদের পড়ানো অনুভব করুন।"],
      ["অগ্রগতির হিসাব", "ক্লাস, উপস্থিতি, হোমওয়ার্ক ও শিক্ষকের মন্তব্য আপনার অ্যাকাউন্টে।"],
      ["অভিভাবকের ভিউ", "অভিভাবক সন্তানের অগ্রগতি দেখতে পারেন।"],
      ["যাচাইযোগ্য সনদ", "সমাপ্তির সনদ, যা যে কেউ অনলাইনে যাচাই করতে পারে।"],
      ["ইংরেজি ও বাংলা", "পুরো ওয়েবসাইট দুই ভাষায় পাওয়া যায়।"],
    ],
    courses: "আমাদের কোর্সসমূহ", all: "সব কোর্স দেখুন", enroll: "ভর্তি / পেমেন্ট",
    reviews: "শিক্ষার্থীরা কী বলছেন", ctaTitle: "শুরু করতে প্রস্তুত?", ctaText: "একটি ফ্রি ট্রায়াল ক্লাস বুক করুন, আমাদের টিম যোগাযোগ করবে।", cta: "ফ্রি ট্রায়াল ক্লাস",
  },
};

export default function HomeSections({ lang }: { lang: Locale }) {
  const t = T[lang];
  const [courses, setCourses] = useState<D[]>([]);
  const [reviews, setReviews] = useState<D[]>([]);
  useEffect(() => {
    if (!firebaseConfigured) return;
    const pub = (c: string) => getDocs(query(collection(getDb(), c), where("status", "==", "published")));
    const rows = (s: Awaited<ReturnType<typeof pub>>) => s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as D).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)).slice(0, 3);
    pub("courses").then((s) => setCourses(rows(s))).catch(() => {});
    pub("reviews").then((s) => setReviews(rows(s))).catch(() => {});
  }, []);

  return (
    <>
      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-center font-serif text-3xl text-sage-900">{t.why}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map(([h, p]) => (
            <li key={h} className="rounded border border-gold-200 bg-white p-5">
              <p className="font-serif text-lg text-sage-900">{h}</p>
              <p className="mt-1 text-sm text-sage-700">{p}</p>
            </li>))}
        </ul>
      </section>

      {courses.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl text-sage-900">{t.courses}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article key={c.id} className="rounded border border-gold-200 bg-white p-5">
                <h3 className="font-serif text-xl text-sage-900">{tx(c, "title", lang)}</h3>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-sage-700">{tx(c, "description", lang)}</p>
                {tx(c, "price", lang) && <p className="mt-3 font-medium text-sage-900">{tx(c, "price", lang)}</p>}
                <Link href={`/${lang}/pay?course=${c.id}`} className="mt-3 inline-block rounded bg-sage-700 px-4 py-2 text-sm text-white">{t.enroll}</Link>
              </article>))}
          </div>
          <p className="mt-6 text-center"><Link href={`/${lang}/courses`} className="underline">{t.all}</Link></p>
        </section>)}

      {reviews.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl text-sage-900">{t.reviews}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <blockquote key={r.id} className="rounded border border-gold-200 bg-white p-5">
                <p className="text-gold-600" aria-label={`${r.rating} / 5`}>{"★".repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-sage-900">{tx(r, "text", lang)}</p>
                <footer className="mt-3 text-xs text-sage-700">{String(r.name ?? "")}{r.country ? ` · ${String(r.country)}` : ""}</footer>
              </blockquote>))}
          </div>
        </section>)}

      <section className="islamic-pattern mx-auto mt-14 max-w-4xl rounded border border-gold-200 bg-cream px-6 py-10 text-center">
        <h2 className="font-serif text-3xl text-sage-900">{t.ctaTitle}</h2>
        <p className="mt-3 text-sage-700">{t.ctaText}</p>
        <Link href={`/${lang}/trial`} className="mt-6 inline-block rounded bg-sage-700 px-6 py-3 font-medium text-white hover:bg-sage-900">{t.cta}</Link>
      </section>
    </>
  );
}
