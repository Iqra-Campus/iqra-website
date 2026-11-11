"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import EmptyState from "@/components/EmptyState";
import type { Locale } from "@/lib/i18n";

type Doc = Record<string, unknown> & { id: string };
const tx = (d: Doc, k: string, lang: Locale) => { const o = d[k] as Record<string, string> | undefined; return (o?.[lang] || o?.en || "") as string; };

export default function PublicList({ col, lang }: { col: "courses" | "teachers" | "faqs" | "pages"; lang: Locale }) {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!firebaseConfigured) { setDocs([]); return; }
    getDocs(query(collection(getDb(), col), where("status", "==", "published")))
      .then((s) => setDocs(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Doc).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))))
      .catch(() => { setFailed(true); setDocs([]); });
  }, [col]);

  if (docs === null) return <p className="py-10 text-center text-sage-700">…</p>;
  if (failed) return <p role="alert" className="py-10 text-center text-red-700">Could not load content. Please refresh.</p>;
  if (docs.length === 0) return <EmptyState lang={lang} />;

  if (col === "faqs") return (
    <div className="mt-8 space-y-3">{docs.map((d) => (
      <details key={d.id} className="rounded border border-gold-200 bg-white p-4"><summary className="cursor-pointer font-medium">{tx(d, "question", lang)}</summary><p className="mt-2 whitespace-pre-line text-sage-700">{tx(d, "answer", lang)}</p></details>
    ))}</div>
  );
  if (col === "pages") return <div className="mt-8 whitespace-pre-line rounded border border-gold-200 bg-white p-6">{tx(docs[0], "body", lang)}</div>;
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{docs.map((d) => (
      <article key={d.id} className="rounded border border-gold-200 bg-white p-5">
        <h2 className="font-serif text-xl text-sage-900">{tx(d, col === "courses" ? "title" : "name", lang)}</h2>
        {col === "teachers" && <p className="mt-1 text-sm text-gold-600">{tx(d, "qualifications", lang)}</p>}
        <p className="mt-2 whitespace-pre-line text-sage-700">{tx(d, col === "courses" ? "description" : "bio", lang)}</p>
        {col === "courses" && <Link href={`/${lang}/pay?course=${d.id}`} className="mt-3 inline-block rounded bg-sage-700 px-4 py-2 text-sm text-white">{lang === "bn" ? "ভর্তি / পেমেন্ট" : "Enroll / Pay"}</Link>}
        {col === "courses" && tx(d, "price", lang) && <p className="mt-3 font-medium text-sage-900">{tx(d, "price", lang)}</p>}
      </article>
    ))}</div>
  );
}
