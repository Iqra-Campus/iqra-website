"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n";

type Card = { id: string; name: string; qual: string; bio: string; photo?: string };
const T = {
  en: { eyebrow: "Our teachers", h: "Meet the teachers", sub: "Caring teachers committed to helping every student improve.", book: "Book a Trial", all: "Meet all teachers", demo: { name: "Teacher Name", qual: "Specialty", bio: "A short introduction about the teacher will appear here." } },
  bn: { eyebrow: "আমাদের শিক্ষকগণ", h: "শিক্ষকদের সাথে পরিচিত হোন", sub: "যত্নশীল শিক্ষকগণ, যাঁরা প্রতিটি শিক্ষার্থীর উন্নতিতে প্রতিশ্রুতিবদ্ধ।", book: "ট্রায়াল বুক করুন", all: "সব শিক্ষক দেখুন", demo: { name: "শিক্ষকের নাম", qual: "বিশেষত্ব", bio: "শিক্ষকের সংক্ষিপ্ত পরিচিতি এখানে দেখানো হবে।" } },
};

function Avatar() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Teacher photo placeholder" preserveAspectRatio="xMidYMid slice">
      <rect width="120" height="120" fill="#12275C" />
      <circle cx="60" cy="46" r="20" fill="#9FB2E0" opacity="0.7" />
      <path d="M20 118c4-26 22-38 40-38s36 12 40 38z" fill="#9FB2E0" opacity="0.5" />
    </svg>
  );
}

function Item({ c, lang }: { c: Card; lang: Locale }) {
  const t = T[lang];
  return (
    <article className="mx-2 w-72 shrink-0 rounded-3xl bg-white p-3 shadow-xl shadow-navy-900/15 ring-1 ring-gold-200">
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        {c.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.photo} alt={c.name} loading="lazy" className="h-full w-full object-cover" /> : <Avatar />}
        {c.qual && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-900">{c.qual}</span>}
      </div>
      <h3 className="mt-4 px-2 font-serif text-xl text-navy-900">{c.name}</h3>
      {c.bio && <p className="mt-1 line-clamp-2 px-2 text-sm text-sage-700">{c.bio}</p>}
      <Link href={`/${lang}/trial`} className="mt-4 block rounded-full border border-gold-200 py-2.5 text-center text-sm font-semibold text-navy-900 hover:bg-cream">{t.book} →</Link>
    </article>
  );
}

export default function HomeTeachers({ lang }: { lang: Locale }) {
  const t = T[lang];
  const [cards, setCards] = useState<Card[] | null>(null);
  useEffect(() => {
    if (!firebaseConfigured) { setCards([]); return; }
    getDocs(query(collection(getDb(), "teachers"), where("status", "==", "published")))
      .then((s) => {
        type Row = { id: string; order?: number; name?: Record<string, string>; qualifications?: Record<string, string>; bio?: Record<string, string>; photo?: unknown };
        const rows: Row[] = s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Row, "id">) }));
        setCards(rows.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
          .map((x) => ({ id: x.id, name: x.name?.[lang] || x.name?.en || "", qual: x.qualifications?.[lang] || x.qualifications?.en || "", bio: x.bio?.[lang] || x.bio?.en || "", photo: typeof x.photo === "string" && x.photo ? x.photo : undefined }))
          .filter((c) => c.name));
      })
      .catch(() => setCards([]));
  }, [lang]);

  if (cards === null) return null;
  const real = cards.length > 0;
  const base: Card[] = real ? cards : Array.from({ length: 4 }, (_, i) => ({ id: `demo${i}`, ...t.demo }));
  const half: Card[] = []; while (half.length < 4) half.push(...base);

  return (
    <section className="mt-16" aria-label={t.h}>
      <div className="mx-auto max-w-3xl px-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-navy-700">— {t.eyebrow} —</p>
        <h2 className="mt-3 font-serif text-3xl text-navy-900 md:text-4xl">{t.h}</h2>
        <p className="mt-3 text-sage-700">{t.sub}</p>
      </div>
      <div className="marquee-wrap mx-auto mt-8 max-w-6xl overflow-hidden motion-reduce:overflow-x-auto">
        <div className="marquee-track flex w-max motion-reduce:animate-none">
          {[0, 1].map((k) => (
            <div key={k} className="flex" aria-hidden={k === 1}>
              {half.map((c, i) => <Item key={`${k}-${c.id}-${i}`} c={c} lang={lang} />)}
            </div>))}
        </div>
      </div>
      {real && <p className="mt-6 text-center"><Link href={`/${lang}/teachers`} className="underline">{t.all}</Link></p>}
    </section>
  );
}
