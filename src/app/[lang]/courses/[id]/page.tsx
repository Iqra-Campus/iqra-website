"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import { courseDocs } from "@/content/courses";
import Icon, { type IconName } from "@/components/Icons";

type D = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Lang = "en" | "bn";
const T = {
  en: { trial: "Book a Free Trial Class", enroll: "Enroll Now", audience: "Who is this course for?", topics: "What you will learn", outcomes: "Objectives and learning outcomes", format: "How classes are held", group: "One student or a group", schedule: "Class time and duration", fee: "Course fee", teachers: "Your teachers", faq: "Common questions", back: "← All courses", notFound: "This course was not found.", ctaTitle: "Ready to start?", ctaText: "Try a free class first, or enroll when you are ready." },
  bn: { trial: "ফ্রি ট্রায়াল ক্লাস বুক করুন", enroll: "ভর্তি হোন", audience: "কাদের জন্য এই কোর্স?", topics: "যা যা শেখানো হবে", outcomes: "উদ্দেশ্য ও শিক্ষার ফলাফল", format: "ক্লাস কীভাবে নেওয়া হয়", group: "একজন নাকি একসাথে কয়েকজন", schedule: "ক্লাসের সময় ও সময়কাল", fee: "কোর্সের ফি", teachers: "আপনার শিক্ষকগণ", faq: "সাধারণ প্রশ্ন ও উত্তর", back: "← সব কোর্স", notFound: "এই কোর্সটি পাওয়া যায়নি।", ctaTitle: "শুরু করতে প্রস্তুত?", ctaText: "আগে একটি ফ্রি ক্লাস করে দেখুন, প্রস্তুত হলে ভর্তি হোন।" },
};
const tx = (d: D, k: string, lang: Lang) => ((d[k]?.[lang] || d[k]?.en || "") as string).trim();
const lines = (s: string) => s.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
const faqs = (s: string) => s.split(/\n\s*\n/).map((b) => { const [q, ...a] = b.trim().split("\n"); return { q: q?.trim() ?? "", a: a.join("\n").trim() }; }).filter((x) => x.q);

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg shadow-navy-900/10 ring-1 ring-gold-200">
      <h2 className="flex items-center gap-3 font-serif text-xl text-navy-900">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><Icon name={icon} className="h-5 w-5" /></span>{title}
      </h2>
      <div className="mt-4 text-sage-900">{children}</div>
    </section>
  );
}
const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">{items.map((x, i) => <li key={i} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-400" aria-hidden="true" /><span>{x}</span></li>)}</ul>
);

export default function CourseDetail() {
  const { lang: l, id } = useParams<{ lang: string; id: string }>();
  const lang: Lang = l === "bn" ? "bn" : "en";
  const t = T[lang];
  const [course, setCourse] = useState<D | null | undefined>(undefined);
  const [teachers, setTeachers] = useState<D[]>([]);

  useEffect(() => {
    const starter = courseDocs().find((c) => c.id === id) as unknown as D | undefined;
    if (!firebaseConfigured) { setCourse(starter ?? null); return; }
    (async () => {
      try {
        const s = await getDoc(doc(getDb(), "courses", id));
        const d = s.exists() && s.data().status === "published" ? ({ id: s.id, ...s.data() } as D) : null;
        if (d) {
          setCourse(d);
          const ids: string[] = Array.isArray(d.teacherIds) ? d.teacherIds : [];
          if (ids.length) {
            const ts = await getDocs(query(collection(getDb(), "teachers"), where("status", "==", "published")));
            setTeachers(ts.docs.map((x) => ({ id: x.id, ...(x.data() as object) }) as D).filter((x) => ids.includes(x.id)));
          }
        } else setCourse(starter ?? null);
      } catch { setCourse(starter ?? null); }
    })();
  }, [id]);

  if (course === undefined) return <p className="p-16 text-center">…</p>;
  if (course === null) return <div className="p-16 text-center"><p>{t.notFound}</p><Link className="mt-3 inline-block underline" href={`/${lang}/courses`}>{t.back}</Link></div>;

  const topics = lines(tx(course, "topics", lang)), outcomes = lines(tx(course, "outcomes", lang)), qa = faqs(tx(course, "faqText", lang));
  const audience = tx(course, "audience", lang), format = tx(course, "format", lang), group = tx(course, "groupType", lang), schedule = tx(course, "schedule", lang), price = tx(course, "price", lang);
  const photo = typeof course.photo === "string" && course.photo ? course.photo : "";

  return (
    <div>
      <section className="soft-hero border-b border-gold-200">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-16">
          <div>
            <Link href={`/${lang}/courses`} className="text-sm text-sage-700 underline">{t.back}</Link>
            {tx(course, "tag", lang) && <p className="mt-5"><span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">{tx(course, "tag", lang)}</span></p>}
            <h1 className="mt-4 font-serif text-4xl leading-tight text-navy-900 md:text-5xl">{tx(course, "title", lang)}</h1>
            <p className="mt-4 whitespace-pre-line text-lg text-sage-700">{tx(course, "description", lang)}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${lang}/trial?course=${course.id}`} className="rounded-full bg-navy-900 px-7 py-3.5 text-center font-semibold text-white hover:bg-navy-800">{t.trial}</Link>
              <Link href={`/${lang}/pay?course=${course.id}`} className="rounded-full border border-navy-900 px-7 py-3.5 text-center font-semibold text-navy-900 hover:bg-white">{t.enroll}</Link>
            </div>
          </div>
          {photo && <div className="overflow-hidden rounded-3xl border-4 border-white shadow-xl shadow-navy-900/20">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo} alt={tx(course, "title", lang)} className="aspect-video w-full object-cover" /></div>}
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10">
        {audience && <Section icon="parent" title={t.audience}><p className="whitespace-pre-line">{audience}</p></Section>}
        {topics.length > 0 && <Section icon="live" title={t.topics}><Bullets items={topics} /></Section>}
        {outcomes.length > 0 && <Section icon="progress" title={t.outcomes}><Bullets items={outcomes} /></Section>}
        {format && <Section icon="live" title={t.format}><p className="whitespace-pre-line">{format}</p></Section>}
        {group && <Section icon="parent" title={t.group}><p className="whitespace-pre-line">{group}</p></Section>}
        {schedule && <Section icon="trial" title={t.schedule}><p className="whitespace-pre-line">{schedule}</p></Section>}
        {price && <Section icon="certificate" title={t.fee}><p className="font-serif text-2xl text-navy-900">{price}</p></Section>}

        {teachers.length > 0 && (
          <Section icon="parent" title={t.teachers}>
            <div className="grid gap-4 sm:grid-cols-2">
              {teachers.map((x) => (
                <article key={x.id} className="flex items-center gap-4 rounded-2xl bg-cream p-4">
                  {typeof x.photo === "string" && x.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.photo} alt={tx(x, "name", lang)} className="h-16 w-16 rounded-full object-cover" /> : <span className="h-16 w-16 shrink-0 rounded-full bg-navy-800" aria-hidden="true" />}
                  <div><p className="font-serif text-lg text-navy-900">{tx(x, "name", lang)}</p><p className="text-xs font-semibold uppercase tracking-wide text-gold-600">{tx(x, "qualifications", lang)}</p></div>
                </article>))}
            </div>
          </Section>)}

        {qa.length > 0 && (
          <Section icon="language" title={t.faq}>
            <div className="space-y-3">{qa.map((x, i) => (
              <details key={i} className="rounded-xl border border-gold-200 p-4"><summary className="cursor-pointer font-medium">{x.q}</summary>{x.a && <p className="mt-2 whitespace-pre-line text-sage-700">{x.a}</p>}</details>))}</div>
          </Section>)}

        <section className="soft-hero rounded-3xl border border-gold-200 px-6 py-10 text-center shadow-lg shadow-navy-900/10">
          <h2 className="font-serif text-2xl text-navy-900">{t.ctaTitle}</h2>
          <p className="mt-2 text-sage-700">{t.ctaText}</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/${lang}/trial?course=${course.id}`} className="rounded-full bg-navy-900 px-7 py-3 font-semibold text-white">{t.trial}</Link>
            <Link href={`/${lang}/pay?course=${course.id}`} className="rounded-full border border-navy-900 px-7 py-3 font-semibold text-navy-900">{t.enroll}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
