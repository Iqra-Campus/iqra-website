"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import EmptyState from "@/components/EmptyState";
import type { Locale } from "@/lib/i18n";
import { defaultFaqs } from "@/content/defaults";
import { courseDocs } from "@/content/courses";

type Doc = Record<string, unknown> & { id: string };
const tx = (d: Doc, k: string, lang: Locale) => { const o = d[k] as Record<string, string> | undefined; return (o?.[lang] || o?.en || "") as string; };

export default function PublicList({ col, lang }: { col: "courses" | "teachers" | "faqs" | "pages" | "reviews" | "blogPosts" | "announcements"; lang: Locale }) {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!firebaseConfigured) { setDocs([]); return; }
    getDocs(query(collection(getDb(), col), where("status", "==", "published")))
      .then((s) => setDocs(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Doc).sort((a, b) => (col === "blogPosts" || col === "announcements") ? Number((b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0) - Number((a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0) : Number(a.order ?? 0) - Number(b.order ?? 0))))
      .catch(() => { setFailed(true); setDocs([]); });
  }, [col]);

  if (docs === null) return <p className="py-10 text-center text-sage-700">…</p>;
  if (failed) return <p role="alert" className="py-10 text-center text-red-700">Could not load content. Please refresh.</p>;
  if (docs.length === 0 && col === "faqs") return (
    <div className="mt-8 space-y-3">{defaultFaqs.map((f, i) => (
      <details key={i} className="rounded border border-gold-200 bg-white p-4"><summary className="cursor-pointer font-medium">{f.q[lang]}</summary><p className="mt-2 whitespace-pre-line text-sage-700">{f.a[lang]}</p></details>
    ))}</div>
  );
  if (docs.length === 0 && col !== "courses") return <EmptyState lang={lang} />;
  const list: Doc[] = docs.length === 0 ? (courseDocs() as unknown as Doc[]) : docs;

  if (col === "faqs") return (
    <div className="mt-8 space-y-3">{docs.map((d) => (
      <details key={d.id} className="rounded border border-gold-200 bg-white p-4"><summary className="cursor-pointer font-medium">{tx(d, "question", lang)}</summary><p className="mt-2 whitespace-pre-line text-sage-700">{tx(d, "answer", lang)}</p></details>
    ))}</div>
  );
  if (col === "teachers") return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{docs.map((d) => (
      <article key={d.id} className="rounded-3xl bg-white p-3 shadow-xl shadow-navy-900/15 ring-1 ring-gold-200">
        <Link href={`/${lang}/teachers/${d.id}`} className="block">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-navy-800">
            {typeof d.photo === "string" && d.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={d.photo} alt={tx(d, "name", lang)} loading="lazy" className="h-full w-full object-cover" /> : <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true"><circle cx="60" cy="46" r="20" fill="#9FB2E0" opacity=".7" /><path d="M20 118c4-26 22-38 40-38s36 12 40 38z" fill="#9FB2E0" opacity=".5" /></svg>}
            {tx(d, "qualifications", lang) && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-900">{tx(d, "qualifications", lang)}</span>}
          </div>
          <h2 className="mt-4 px-2 font-serif text-xl text-navy-900">{tx(d, "name", lang)}</h2>
          <p className="mt-1 line-clamp-3 px-2 text-sm text-sage-700">{tx(d, "bio", lang)}</p>
        </Link>
        <div className="mt-4 flex gap-2 px-1 pb-1">
          <Link href={`/${lang}/teachers/${d.id}`} className="flex-1 rounded-full border border-gold-200 py-2.5 text-center text-sm font-semibold text-navy-900 hover:bg-cream">{lang === "bn" ? "প্রোফাইল দেখুন" : "View profile"}</Link>
          <Link href={`/${lang}/trial?teacher=${d.id}`} className="flex-1 rounded-full bg-navy-900 py-2.5 text-center text-sm font-semibold text-white">{lang === "bn" ? "ক্লাস বুক" : "Book a class"}</Link>
        </div>
      </article>))}</div>
  );
  if (col === "blogPosts") return (
    <div className="mt-8 space-y-3">{docs.map((d) => (
      <details key={d.id} className="rounded border border-gold-200 bg-white p-4">
        <summary className="cursor-pointer"><span className="font-serif text-lg text-sage-900">{tx(d, "title", lang)}</span>{tx(d, "summary", lang) && <span className="mt-1 block text-sm text-sage-700">{tx(d, "summary", lang)}</span>}</summary>
        <div className="mt-3 whitespace-pre-line leading-relaxed text-sage-900">{tx(d, "body", lang)}</div>
        {d.author ? <p className="mt-3 text-xs text-sage-500">— {String(d.author)}</p> : null}
      </details>))}</div>
  );
  if (col === "announcements") return (
    <div className="mt-8 space-y-3">{docs.map((d) => (
      <article key={d.id} className="rounded border border-gold-200 bg-white p-4"><p className="font-medium text-sage-900">{tx(d, "title", lang)}</p><p className="mt-1 whitespace-pre-line text-sm text-sage-700">{tx(d, "text", lang)}</p></article>))}</div>
  );
  if (col === "reviews") return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{docs.map((d) => (
      <blockquote key={d.id} className="rounded border border-gold-200 bg-white p-5">
        <p className="text-gold-600" aria-label={`${d.rating} / 5`}>{"★".repeat(Math.max(0, Math.min(5, Number(d.rating) || 0)))}</p>
        <p className="mt-2 whitespace-pre-line text-sage-900">{tx(d, "text", lang)}</p>
        <footer className="mt-3 text-sm text-sage-700">{String(d.name ?? "")}{d.country ? ` · ${String(d.country)}` : ""}</footer>
      </blockquote>
    ))}</div>
  );
  if (col === "pages") return <div className="mt-8 whitespace-pre-line rounded border border-gold-200 bg-white p-6">{tx(docs[0], "body", lang)}</div>;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{list.map((d) => (
      <article key={d.id} className="rounded border border-gold-200 bg-white p-5">
        <h2 className="font-serif text-xl text-sage-900">{tx(d, "title", lang)}</h2>
        <p className="mt-2 whitespace-pre-line text-sage-700">{tx(d, "description", lang)}</p>
        {col === "courses" && <div className="mt-4 flex flex-wrap gap-3"><Link href={`/${lang}/courses/${d.id}`} className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white">{lang === "bn" ? "বিস্তারিত দেখুন" : "View details"}</Link><Link href={`/${lang}/trial?course=${d.id}`} className="rounded-full border border-navy-900 px-5 py-2 text-sm font-semibold text-navy-900">{lang === "bn" ? "ফ্রি ট্রায়াল" : "Free trial"}</Link></div>}
        {col === "courses" && tx(d, "price", lang) && <p className="mt-3 font-medium text-sage-900">{tx(d, "price", lang)}</p>}
      </article>
    ))}</div>
  );
}
