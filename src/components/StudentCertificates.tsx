"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export default function StudentCertificates({ lang, userId }: { lang: "en" | "bn"; userId: string }) {
  const [rows, setRows] = useState<{ id: string; en: string; bn: string; status: string }[]>([]);
  useEffect(() => {
    getDocs(query(collection(getDb(), "certificates"), where("userId", "==", userId)))
      .then((s) => setRows(s.docs.filter((d) => d.data().status === "active").map((d) => ({ id: d.id, en: d.data().courseTitleEn, bn: d.data().courseTitleBn, status: d.data().status }))))
      .catch(() => setRows([]));
  }, [userId]);
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="font-serif text-xl text-sage-900">{lang === "bn" ? "আমার সনদ" : "My certificates"}</h2>
      <ul className="mt-2 space-y-2">{rows.map((r) => (
        <li key={r.id} className="rounded border border-sage-300 bg-white p-3 text-sm">
          {lang === "bn" ? r.bn || r.en : r.en} · <a className="underline" href={`/${lang}/certificate?code=${r.id}`}>{lang === "bn" ? "দেখুন / প্রিন্ট" : "View / print"}</a>
        </li>))}</ul>
    </section>
  );
}
