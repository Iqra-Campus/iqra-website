"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n";
import HomeTeachers from "@/components/HomeTeachers";
import Carousel from "@/components/Carousel";
import Reveal from "@/components/Reveal";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
const tx = (d: D, k: string, lang: Locale) => (d[k]?.[lang] || d[k]?.en || "") as string;

const T = {
  en: {
    ticker: ["Live Online Classes", "Free Trial Class", "Parent View", "Verified Certificates", "English & Bangla"],
    whyEyebrow: "Why IQRA CAMPUS", whyTitle: "A better way to learn", whySub: "Live classes, clear tracking and a caring approach.",
    features: [
      ["Live Online Classes", "Learn with qualified teachers from wherever you are."],
      ["Free Trial Class", "Experience our teaching before you enrol."],
      ["Track Progress", "Classes, attendance, homework and teacher feedback in your account."],
      ["Parent View", "Parents can follow their child's progress."],
      ["Verified Certificates", "Completion certificates anyone can verify online."],
      ["English & Bangla", "The whole website is available in both languages."],
    ],
    cEyebrow: "Our courses", cTitle: "Find the right course", all: "Explore all courses", details: "Details →", book: "Book Trial",
    pEyebrow: "Parent experience", pTitle: "See your child's progress", pSub: "Parents get their own view, linked to their child's account.",
    parent: [["Attendance", "Present, late and absent classes at a glance."], ["Homework & feedback", "Submissions, grades and teacher comments."], ["Courses & payments", "Enrolment and the status of each payment request."]],
    pCta: "Parent login",
    reviews: "What students say", ctaTitle: "Ready to begin?", ctaText: "Book a free trial class and our team will contact you.", cta: "Free Trial Class",
  },
  bn: {
    ticker: ["সরাসরি অনলাইন ক্লাস", "ফ্রি ট্রায়াল ক্লাস", "অভিভাবকের ভিউ", "যাচাইযোগ্য সনদ", "ইংরেজি ও বাংলা"],
    whyEyebrow: "কেন ইকরা ক্যাম্পাস", whyTitle: "শেখার আরও ভালো উপায়", whySub: "সরাসরি ক্লাস, স্পষ্ট হিসাব ও যত্নশীল পদ্ধতি।",
    features: [
      ["সরাসরি অনলাইন ক্লাস", "যেখানেই থাকুন, যোগ্য শিক্ষকদের সাথে শিখুন।"],
      ["ফ্রি ট্রায়াল ক্লাস", "ভর্তির আগে আমাদের পড়ানো অনুভব করুন।"],
      ["অগ্রগতির হিসাব", "ক্লাস, উপস্থিতি, হোমওয়ার্ক ও শিক্ষকের মন্তব্য আপনার অ্যাকাউন্টে।"],
      ["অভিভাবকের ভিউ", "অভিভাবক সন্তানের অগ্রগতি দেখতে পারেন।"],
      ["যাচাইযোগ্য সনদ", "সমাপ্তির সনদ, যা যে কেউ অনলাইনে যাচাই করতে পারে।"],
      ["ইংরেজি ও বাংলা", "পুরো ওয়েবসাইট দুই ভাষায় পাওয়া যায়।"],
    ],
    cEyebrow: "আমাদের কোর্সসমূহ", cTitle: "আপনার উপযুক্ত কোর্স বেছে নিন", all: "সব কোর্স দেখুন", details: "বিস্তারিত →", book: "ট্রায়াল বুক করুন",
    pEyebrow: "অভিভাবকের অভিজ্ঞতা", pTitle: "সন্তানের অগ্রগতি দেখুন", pSub: "অভিভাবক সন্তানের অ্যাকাউন্টের সাথে যুক্ত নিজস্ব ভিউ পান।",
    parent: [["উপস্থিতি", "উপস্থিত, দেরিতে ও অনুপস্থিত ক্লাস এক নজরে।"], ["হোমওয়ার্ক ও মন্তব্য", "জমা, গ্রেড ও শিক্ষকের মন্তব্য।"], ["কোর্স ও পেমেন্ট", "ভর্তি এবং প্রতিটি পেমেন্ট অনুরোধের অবস্থা।"]],
    pCta: "অভিভাবক লগইন",
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
    const rows = (s: Awaited<ReturnType<typeof pub>>, n: number) => s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as D).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)).slice(0, n);
    pub("courses").then((s) => setCourses(rows(s, 8))).catch(() => {});
    pub("reviews").then((s) => setReviews(rows(s, 3))).catch(() => {});
  }, []);
  const tick = [...t.ticker, ...t.ticker, ...t.ticker];

  return (
    <>
      {/* Ticker */}
      <div className="overflow-hidden border-y border-gold-200 bg-white py-4" aria-hidden="true">
        <div className="ticker-track flex w-max">
          {[0, 1].map((k) => <div key={k} className="flex">{tick.map((x, i) => <span key={`${k}-${i}`} className="flex items-center whitespace-nowrap px-5 text-lg font-semibold text-navy-900"><span className="mr-5 text-navy-700">✦</span>{x}</span>)}</div>)}
        </div>
      </div>

      {/* Why: dark glowing cards (swipe on phones, grid on large screens) */}
      <section className="dark-glow islamic-pattern mt-14 py-16 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center lg:max-w-6xl lg:px-6 lg:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-400">— {t.whyEyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl drop-shadow md:text-4xl">{t.whyTitle}</h2>
          <div className="mx-auto mt-4 h-1 w-24 rounded bg-gold-400 lg:mx-0" />
          <p className="mt-4 text-navy-200">{t.whySub}</p>
        </div>
        <div className="mt-10 lg:hidden">
          <Carousel dark label={t.whyTitle}>
            {t.features.map(([h, p], i) => (
              <article key={h} className="card-glow relative w-[82%] max-w-sm rounded-3xl p-7">
                <span className="num absolute right-6 top-4 font-serif text-6xl font-bold">{String(i + 1).padStart(2, "0")}</span>
                <span className="icon-float mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-xl text-navy-900" aria-hidden="true">✦</span>
                <h3 className="mt-6 font-serif text-2xl text-white">{h}</h3>
                <p className="mt-2 text-navy-200">{p}</p>
              </article>))}
          </Carousel>
        </div>
        <div className="mx-auto mt-12 hidden max-w-6xl grid-cols-3 gap-6 px-6 lg:grid">
          {t.features.map(([h, p], i) => (
            <Reveal key={h} delay={i * 90}>
              <article className="card-glow relative h-full rounded-3xl p-8">
                <span className="num absolute right-7 top-5 font-serif text-6xl font-bold">{String(i + 1).padStart(2, "0")}</span>
                <span className="icon-float flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-xl text-navy-900" aria-hidden="true">✦</span>
                <h3 className="mt-6 font-serif text-2xl text-white">{h}</h3>
                <p className="mt-2 text-navy-200">{p}</p>
              </article>
            </Reveal>))}
        </div>
      </section>

      {/* Courses */}
      {courses.length > 0 && (
        <section className="mt-16">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-navy-700">— {t.cEyebrow} —</p>
            <h2 className="mt-3 font-serif text-3xl text-navy-900 md:text-4xl">{t.cTitle}</h2>
            <p className="mt-4"><Link href={`/${lang}/courses`} className="border-b border-navy-900 pb-0.5 text-sm font-bold uppercase tracking-wide text-navy-900">{t.all} →</Link></p>
          </div>
          <div className="mt-8">
            <Carousel label={t.cTitle}>
              {courses.map((c) => (
                <article key={c.id} className="w-[85%] max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl shadow-navy-900/15 ring-1 ring-gold-200 transition-transform duration-300 hover:-translate-y-1.5">
                  <div className="islamic-pattern relative flex h-48 items-end bg-gradient-to-br from-navy-900 to-navy-700 p-5">
                    {typeof c.photo === "string" && c.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
                    {tx(c, "tag", lang) && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy-900">{tx(c, "tag", lang)}</span>}
                    <h3 className="relative font-serif text-2xl text-white">{tx(c, "title", lang)}</h3>
                  </div>
                  <div className="p-5">
                    <p className="line-clamp-3 whitespace-pre-line text-sm text-sage-700">{tx(c, "description", lang)}</p>
                    {tx(c, "price", lang) && <p className="mt-3 font-semibold text-navy-900">{tx(c, "price", lang)}</p>}
                    <div className="mt-4 flex items-center justify-between border-t border-gold-200 pt-4">
                      <Link href={`/${lang}/courses`} className="text-sm font-bold text-navy-900">{t.details}</Link>
                      <Link href={`/${lang}/trial?course=${c.id}`} className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white">{t.book}</Link>
                    </div>
                  </div>
                </article>))}
            </Carousel>
          </div>
        </section>)}

      <HomeTeachers lang={lang} />

      {/* Parent experience */}
      <section className="mx-auto mt-16 max-w-4xl px-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-navy-700">— {t.pEyebrow}</p>
        <h2 className="mt-3 font-serif text-3xl text-navy-900 md:text-4xl">{t.pTitle}</h2>
        <div className="mt-4 h-1 w-24 rounded bg-gold-400" />
        <p className="mt-4 text-sage-700">{t.pSub}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {t.parent.map(([h, p]) => <div key={h} className="rounded-2xl bg-cream p-5"><p className="font-serif text-lg text-navy-900">{h}</p><p className="mt-1 text-sm text-sage-700">{p}</p></div>)}
        </div>
        <Link href={`/${lang}/login`} className="mt-6 inline-block rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white">{t.pCta}</Link>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl text-navy-900">{t.reviews}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <blockquote key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gold-200">
                <p className="text-gold-600" aria-label={`${r.rating} / 5`}>{"★".repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-sage-900">{tx(r, "text", lang)}</p>
                <footer className="mt-3 text-xs text-sage-700">{String(r.name ?? "")}{r.country ? ` · ${String(r.country)}` : ""}</footer>
              </blockquote>))}
          </div>
        </section>)}

      <section className="islamic-pattern mx-4 mt-16 rounded-3xl bg-navy-900 px-6 py-12 text-center text-white md:mx-auto md:max-w-4xl">
        <h2 className="font-serif text-3xl">{t.ctaTitle}</h2>
        <p className="mt-3 text-navy-300">{t.ctaText}</p>
        <Link href={`/${lang}/trial`} className="mt-6 inline-block rounded-full bg-gold-400 px-7 py-3 font-semibold text-navy-900 hover:bg-gold-200">{t.cta}</Link>
      </section>
    </>
  );
}
