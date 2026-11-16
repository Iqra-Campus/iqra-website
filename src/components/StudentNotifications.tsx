"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

type N = { id: string; title: { en: string; bn: string }; read: boolean; createdAt?: { seconds: number } };

export default function StudentNotifications({ lang, userId }: { lang: "en" | "bn"; userId: string }) {
  const [rows, setRows] = useState<N[]>([]);
  const load = useCallback(async () => {
    try {
      const s = await getDocs(query(collection(getDb(), "notifications"), where("userId", "==", userId)));
      setRows(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<N, "id">) })).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)).slice(0, 10));
    } catch { setRows([]); }
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  async function readAll() {
    try {
      const db = getDb(); const b = writeBatch(db);
      rows.filter((r) => !r.read).forEach((r) => b.update(doc(db, "notifications", r.id), { read: true }));
      await b.commit(); await load();
    } catch { /* leave unread */ }
  }
  if (rows.length === 0) return null;
  const unread = rows.filter((r) => !r.read).length;
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-sage-900">{lang === "bn" ? "নোটিফিকেশন" : "Notifications"}{unread > 0 && <span className="ml-2 rounded-full bg-gold-400 px-2 py-0.5 text-xs text-white">{unread}</span>}</h2>
        {unread > 0 && <button onClick={readAll} className="text-sm underline">{lang === "bn" ? "সব পড়া হয়েছে" : "Mark all read"}</button>}
      </div>
      <ul className="mt-2 space-y-2">{rows.map((r) => (
        <li key={r.id} className={`rounded border p-3 text-sm ${r.read ? "border-sage-300 bg-white" : "border-gold-400 bg-gold-200/30"}`}>{r.title[lang] || r.title.en}</li>))}</ul>
    </section>
  );
}
