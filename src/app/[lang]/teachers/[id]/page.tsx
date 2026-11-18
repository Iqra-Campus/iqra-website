"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import { youtubeEmbed } from "@/lib/video";
import Icon, { type IconName } from "@/components/Icons";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Lang = "en" | "bn";
const T = {
  en: { book: "Book a class with", courses: "View courses", edu: "Education and certificates", expertise: "Areas of expertise", exp: "Teaching experience", langs: "Languages", ages: "Students taught", taught: "Courses taught", video: "Introduction video", reviews: "Student feedback", reviewsNote: "Feedback reviewed by our team.", back: "← All teachers", notFound: "This teacher profile was not found.", ctaTitle: "Learn with", ctaText: "Book a free trial class and our team will confirm the time with you.", view: "View course" },
  bn: { book: "ক্লাস বুক করুন:", courses: "কোর্সগুলো দেখুন", edu: "শিক্ষাগত যোগ্যতা ও সার্টিফিকেট", expertise: "দক্ষতার ক্ষেত্র", exp: "শিক্ষকতার অভিজ্ঞতা", langs: "যে ভাষায় পড়ান", ages: "যাদের পড়ান", taught: "যে কোর্সগুলো পড়ান", video: "পরিচিতিমূলক ভিডিও", reviews: "শিক্ষার্থীদের মতামত", reviewsNote: "আমাদের টিম যাচাই করা মতামত।", back: "← সব শিক্ষক", notFound: "এই শিক্ষকের প্রোফাইল পাওয়া যায়নি।", ctaTitle: "পড়ুন", ctaText: "একটি ফ্রি ট্রায়াল ক্লাস বুক করুন, আমাদের টিম আপনার সাথে সময় নিশ্চিত করবে।", view: "কোর্স দেখুন" },
};
const tx = (d: D, k: string, lang: Lang) => ((d[k]?.[lang] || d[k]?.en || "") as string).trim();
const lines = (s: string) => s.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);

function Section({ icon, title, note, children }: { icon: IconName; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-navy-900/10 ring-1 ring-gold-200">
      <h2 className="flex items-center gap-3 font-serif text-xl text-navy-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><Icon name={icon} className="h-5 w-5" /></span>{title}
      </h2>
      {note && <p className="mt-1 text-xs text-sage-500">{note}</p>}
      <div className="mt-4 text-sage-900">{children}</div>
    </section>
  );
}
const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">{items.map((x, i) => <li key={i} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-400" aria-hidden="true" /><span>{x}</span></li>)}</ul>
);

export default function TeacherProfile() {
  const { lang: l, id } = useParams<{ lang: string; id: string }>();
  const lang: Lang = l === "bn" ? "bn" : "en";
  const t = T[lang];
  const [teacher, setTeacher] = useState<D | null | undefined>(undefined);
  const [courses, setCourses] = useState<D[]>([]);
  const [reviews, setReviews] = useState<D[]>([]);

  useEffect(() => {
    if (!firebaseConfigured) { setTeacher(null); return; }
    (async () => {
      try {
        const db = getDb();
        const s = await getDoc(doc(db, "teachers", id));
        if (!s.exists() || s.data().status !== "published") { setTeacher(null); return; }
        setTeacher({ id: s.id, ...s.data() } as D);
        const [c, r] = await Promise.all([
          getDocs(query(collection(db, "courses"), where("status", "==", "published"))),
          getDocs(query(collection(db, "reviews"), where("status", "==", "published"))),
        ]);
        const rows = (x: typeof c) => x.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as D).filter((d) => Array.isArray(d.teacherIds) && d.teacherIds.includes(id));
        setCourses(rows(c).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)));
        setReviews(rows(r));
      } catch { setTeacher(null); }
    })();
  }, [id]);

  if (teacher === undefined) return <p className="p-16 text-center">…</p>;
  if (teacher === null) return <div className="p-16 text-center"><p>{t.notFound}</p><Link className="mt-3 inline-block underline" href={`/${lang}/teachers`}>{t.back}</Link></div>;

  const name = tx(teacher, "name", lang);
  const photo = typeof teacher.photo === "string" && teacher.photo ? teacher.photo : "";
  const edu = lines(tx(teacher, "education", lang)), expertise = lines(tx(teacher, "expertise", lang));
  const exp = tx(teacher, "experience", lang), langs = tx(teacher, "languages", lang), ages = tx(teacher, "ages", lang);
  const embed = youtubeEmbed(typeof teacher.videoUrl === "string" ? teacher.videoUrl : undefined);

  return (
    <div>
      <section className="soft-hero border-b border-gold-200">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 py-12 text-center md:flex-row md:items-center md:py-16 md:text-left">
          <div className="h-44 w-44 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-sage-100 shadow-xl shadow-navy-900/20 md:h-52 md:w-52">
            {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt={name} className="h-full w-full object-cover" /> : <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true"><circle cx="60" cy="46" r="20" fill="#C3CCE6" /><path d="M20 118c4-26 22-38 40-38s36 12 40 38z" fill="#A9B5D9" /></svg>}
          </div>
          <div>
            <Link href={`/${lang}/teachers`} className="text-sm text-sage-700 underline">{t.back}</Link>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-navy-900 md:text-5xl">{name}</h1>
            {tx(teacher, "qualifications", lang) && <p className="mt-2 text-sm font-bold uppercase tracking-wide text-gold-600">{tx(teacher, "qualifications", lang)}</p>}
            {tx(teacher, "bio", lang) && <p className="mt-3 max-w-2xl whitespace-pre-line text-sage-700">{tx(teacher, "bio", lang)}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${lang}/trial?teacher=${teacher.id}`} className="rounded-full bg-navy-900 px-7 py-3.5 text-center font-semibold text-white hover:bg-navy-800">{t.book} {name}</Link>
              {courses.length > 0 && <a href="#courses" className="rounded-full border border-navy-900 px-7 py-3.5 text-center font-semibold text-navy-900 hover:bg-white">{t.courses}</a>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10">
        {edu.length > 0 && <Section icon="certificate" title={t.edu}><Bullets items={edu} /></Section>}
        {expertise.length > 0 && (
          <Section icon="live" title={t.expertise}>
            <ul className="flex flex-wrap gap-2">{expertise.map((x, i) => <li key={i} className="rounded-full bg-navy-900 px-4 py-1.5 text-sm font-semibold text-white">{x}</li>)}</ul>
          </Section>)}
        {exp && <Section icon="progress" title={t.exp}><p className="whitespace-pre-line">{exp}</p></Section>}
        {(langs || ages) && (
          <Section icon="language" title={`${t.langs} / ${t.ages}`}>
            {langs && <p><b>{t.langs}:</b> {langs}</p>}
            {ages && <p className="mt-2"><b>{t.ages}:</b> {ages}</p>}
          </Section>)}
        {courses.length > 0 && (
          <div id="courses"><Section icon="trial" title={t.taught}>
            <div className="grid gap-3 sm:grid-cols-2">{courses.map((c) => (
              <Link key={c.id} href={`/${lang}/courses/${c.id}`} className="rounded-2xl bg-cream p-4 hover:ring-2 hover:ring-gold-400">
                <p className="font-serif text-lg text-navy-900">{tx(c, "title", lang)}</p><p className="mt-1 text-sm text-navy-700">{t.view} →</p>
              </Link>))}</div>
          </Section></div>)}
        {embed && (
          <Section icon="live" title={t.video}>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe src={embed} title={`${name} — ${t.video}`} className="h-full w-full" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </Section>)}
        {reviews.length > 0 && (
          <Section icon="parent" title={t.reviews} note={t.reviewsNote}>
            <div className="grid gap-3 sm:grid-cols-2">{reviews.map((r) => (
              <blockquote key={r.id} className="rounded-2xl bg-cream p-4">
                <p className="text-gold-600" aria-label={`${r.rating} / 5`}>{"★".repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))}</p>
                <p className="mt-1 whitespace-pre-line text-sm">{tx(r, "text", lang)}</p>
                <footer className="mt-2 text-xs text-sage-700">{String(r.name ?? "")}{r.country ? ` · ${String(r.country)}` : ""}</footer>
              </blockquote>))}</div>
          </Section>)}

        <section className="soft-hero rounded-3xl border border-gold-200 px-6 py-10 text-center shadow-lg shadow-navy-900/10">
          <h2 className="font-serif text-2xl text-navy-900">{t.ctaTitle} {name}</h2>
          <p className="mt-2 text-sage-700">{t.ctaText}</p>
          <Link href={`/${lang}/trial?teacher=${teacher.id}`} className="mt-5 inline-block rounded-full bg-navy-900 px-7 py-3 font-semibold text-white">{t.book} {name}</Link>
        </section>
      </div>
    </div>
  );
}
