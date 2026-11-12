"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";
import EmptyState from "@/components/EmptyState";
import type { Locale } from "@/lib/i18n";

export default function PublicPage({ id, lang }: { id: string; lang: Locale }) {
  const [state, setState] = useState<"loading" | "empty" | { body: string }>("loading");
  useEffect(() => {
    if (!firebaseConfigured) { setState("empty"); return; }
    getDoc(doc(getDb(), "pages", id)).then((s) => {
      const d = s.exists() ? s.data() : null;
      const body = d && d.status === "published" ? ((d.body?.[lang] || d.body?.en || "") as string) : "";
      setState(body ? { body } : "empty");
    }).catch(() => setState("empty"));
  }, [id, lang]);
  if (state === "loading") return <p className="py-10 text-center text-sage-700">…</p>;
  if (state === "empty") return <EmptyState lang={lang} />;
  return <div className="mt-8 whitespace-pre-line rounded border border-gold-200 bg-white p-6 leading-relaxed text-sage-900">{state.body}</div>;
}
