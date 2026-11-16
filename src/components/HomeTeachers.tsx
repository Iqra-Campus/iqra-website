"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n";

type Card = { id: string; name: string; qual: string; bio: string; photo?: string; demo?: boolean };
const T = {
  en: { h: "Our teachers", all: "Meet all teachers", demo: [{ name: "Teacher Name", qual: "Qualification / Specialty", bio: "A short introduction about the teacher will appear here." }] },
  bn: { h: "আমাদের শিক্ষকগণ", all: "সব শিক্ষক দেখুন", demo: [{ name: "শিক্ষকের নাম", qual: "যোগ্যতা / বিশেষত্ব", bio: "শিক্ষকের সংক্ষিপ্ত পরিচিতি এখানে দেখানো হবে।" }] },
};

function Avatar() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Teacher photo placeholder">
      <rect width="120" height="120" fill="#E6EDE3" />
      <circle cx="60" cy="46" r="20" fill="#B5C7AF" />
      <path d="M20 112c4-24 22-36 40-36s36 12 40 36z" fill="#8FA98A" />
    </svg>
  );
}

function Item({ c }: { c: Card }) {
  return (
    <article className="mx-2 w-64 shrink-0 rounded-lg border border-gold-200 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-gold-200">
        {c.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.photo} alt={c.name} loading="lazy" className="h-full w-full object-cover" /> : <Avatar />}
      </div>
      <h3 className="mt-3 font-serif text-lg text-sage-900">{c.name}</h3>
      {c.qual && <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gold-600">{c.qual}</p>}
      {c.bio && <p className="mt-2 line-clamp-3 text-sm text-sage-700">{c.bio}</p>}
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
        setCards(rows
          .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
          .map((x) => ({ id: x.id, name: x.name?.[lang] || x.name?.en || "", qual: x.qualifications?.[lang] || x.qualifications?.en || "", bio: x.bio?.[lang] || x.bio?.en || "", photo: typeof x.photo === "string" && x.photo ? x.photo : undefined }))
          .filter((c) => c.name));
      })
      .catch(() => setCards([]));
  }, [lang]);

  if (cards === null) return null;
  const real = cards.length > 0;
  const base: Card[] = real ? cards : Array.from({ length: 6 }, (_, i) => ({ id: `demo${i}`, ...t.demo[0], demo: true }));
  // Repeat so the loop is seamless even with only a few teachers.
  const half: Card[] = []; while (half.length < 6) half.push(...base);

  return (
    <section className="mt-14" aria-label={t.h}>
      <h2 className="text-center font-serif text-3xl text-sage-900">{t.h}</h2>
      <div className="marquee-wrap mx-auto mt-8 max-w-6xl overflow-hidden motion-reduce:overflow-x-auto">
        <div className="marquee-track flex w-max motion-reduce:animate-none">
          {[0, 1].map((k) => (
            <div key={k} className="flex" aria-hidden={k === 1}>
              {half.map((c, i) => <Item key={`${k}-${c.id}-${i}`} c={c} />)}
            </div>))}
        </div>
      </div>
      {real && <p className="mt-6 text-center"><Link href={`/${lang}/teachers`} className="underline">{t.all}</Link></p>}
    </section>
  );
}
