"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n";

type A = { id: string; title: string; text: string; at: number };

export default function HomeAnnouncements({ lang }: { lang: Locale }) {
  const [rows, setRows] = useState<A[]>([]);
  useEffect(() => {
    if (!firebaseConfigured) return;
    getDocs(query(collection(getDb(), "announcements"), where("status", "==", "published")))
      .then((s) => setRows(s.docs.map((d) => { const x = d.data(); return { id: d.id, title: x.title?.[lang] || x.title?.en || "", text: x.text?.[lang] || x.text?.en || "", at: x.createdAt?.seconds ?? 0 }; })
        .filter((a) => a.title).sort((a, b) => b.at - a.at).slice(0, 3)))
      .catch(() => setRows([]));
  }, [lang]);
  if (rows.length === 0) return null;
  return (
    <section className="mx-auto mt-8 max-w-4xl px-4" aria-label={lang === "bn" ? "ঘোষণা" : "Announcements"}>
      <h2 className="font-serif text-xl text-sage-900">{lang === "bn" ? "ঘোষণা" : "Announcements"}</h2>
      <ul className="mt-3 space-y-2">{rows.map((a) => (
        <li key={a.id} className="rounded border border-gold-200 bg-white p-4"><p className="font-medium text-sage-900">{a.title}</p>{a.text && <p className="mt-1 whitespace-pre-line text-sm text-sage-700">{a.text}</p>}</li>))}</ul>
    </section>
  );
}
