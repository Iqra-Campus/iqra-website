"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import { ui, type Locale } from "@/lib/i18n";

export default function HomeHero({ lang }: { lang: Locale }) {
  const t = ui[lang];
  const [c, setC] = useState<{ title?: string; text?: string; eyebrow?: string }>({});
  useEffect(() => {
    if (!firebaseConfigured) return;
    getDoc(doc(getDb(), "siteSettings", "home")).then((s) => {
      if (!s.exists() || s.data().status !== "published") return;
      const d = s.data() as Record<string, Record<string, string>>;
      setC({ title: d.heroTitle?.[lang], text: d.heroText?.[lang], eyebrow: d.heroEyebrow?.[lang] });
    }).catch(() => {});
  }, [lang]);
  return (
    <section className="islamic-pattern bg-gradient-to-b from-ivory to-cream">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
        <p className="text-sm uppercase tracking-widest text-gold-600">{c.eyebrow || t.heroEyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-sage-900 md:text-5xl">{c.title || t.heroTitle}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-sage-700">{c.text || t.heroText}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${lang}/trial`} className="rounded bg-sage-700 px-6 py-3 font-medium text-white hover:bg-sage-900">{t.trial}</Link>
          <Link href={`/${lang}/courses`} className="rounded border border-gold-400 px-6 py-3 font-medium text-sage-900 hover:bg-gold-200/40">{t.explore}</Link>
        </div>
      </div>
    </section>
  );
}
