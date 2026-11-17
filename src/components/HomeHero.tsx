"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import { ui, type Locale } from "@/lib/i18n";
import { siteContact } from "@/config/site";

const ticks = {
  en: ["No credit card required", "Free trial class", "English & Bangla"],
  bn: ["ক্রেডিট কার্ড লাগবে না", "ফ্রি ট্রায়াল ক্লাস", "ইংরেজি ও বাংলা"],
};

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
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-12 text-center md:pb-16 md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600">{c.eyebrow || t.heroEyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-navy-900 md:text-5xl">{c.title || t.heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-sage-700">{c.text || t.heroText}</p>
        <div className="mx-auto mt-7 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link href={`/${lang}/trial`} className="rounded-full bg-navy-900 px-7 py-3.5 text-center font-semibold text-white shadow hover:bg-navy-800">{t.trial}</Link>
          <a href={siteContact.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-gold-200 bg-white px-7 py-3.5 font-semibold text-navy-900 shadow-sm hover:bg-cream">
            <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />{lang === "bn" ? "WhatsApp-এ কথা বলুন" : "Chat on WhatsApp"}
          </a>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-sage-700">
          {ticks[lang].map((x) => <li key={x} className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/10 text-xs text-navy-900" aria-hidden="true">✓</span>{x}</li>)}
        </ul>
      </div>
    </section>
  );
}
