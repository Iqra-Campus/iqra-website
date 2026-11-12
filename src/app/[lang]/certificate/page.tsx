"use client";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase";

type Cert = { userName: string; courseTitleEn: string; courseTitleBn: string; status: string; issuedAt?: { toDate: () => Date } };
const T = {
  en: { h: "Verify / View Certificate", code: "Certificate code", go: "Verify", notFound: "No certificate found for this code.", revoked: "This certificate has been revoked and is not valid.", valid: "Valid certificate", cert: "Certificate of Completion", certify: "This is to certify that", done: "has successfully completed the course", issued: "Issued on", print: "Print / Save as PDF", nocfg: "Not available yet." },
  bn: { h: "সনদ যাচাই / দেখুন", code: "সনদের কোড", go: "যাচাই করুন", notFound: "এই কোডে কোনো সনদ পাওয়া যায়নি।", revoked: "এই সনদ বাতিল করা হয়েছে, বৈধ নয়।", valid: "বৈধ সনদ", cert: "সমাপ্তির সনদ", certify: "এই মর্মে প্রত্যয়ন করা যাচ্ছে যে", done: "সফলভাবে কোর্সটি সম্পন্ন করেছেন:", issued: "প্রদানের তারিখ", print: "প্রিন্ট / PDF হিসেবে সংরক্ষণ", nocfg: "এখনো চালু হয়নি।" },
};

function Inner() {
  const { lang } = useParams<{ lang: "en" | "bn" }>();
  const t = T[lang] ?? T.en;
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "notfound" | Cert>("idle");

  async function check(raw: string) {
    const c = raw.trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,30}$/.test(c)) { setState("notfound"); return; }
    setState("loading");
    try {
      const s = await getDoc(doc(getDb(), "certificates", c));
      setState(s.exists() ? (s.data() as Cert) : "notfound");
    } catch { setState("notfound"); }
  }
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("code");
    if (q && firebaseConfigured) { setCode(q); check(q); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!firebaseConfigured) return <p className="p-10 text-center">{t.nocfg}</p>;
  const cert = typeof state === "object" ? state : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <form onSubmit={(e) => { e.preventDefault(); check(code); }} className="print:hidden">
        <h1 className="text-center font-serif text-3xl text-sage-900">{t.h}</h1>
        <div className="mx-auto mt-4 flex max-w-md gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.code} aria-label={t.code} className="flex-1 rounded border border-sage-300 px-3 py-2" />
          <button className="rounded bg-sage-700 px-4 py-2 text-white">{t.go}</button>
        </div>
      </form>
      {state === "loading" && <p className="mt-6 text-center">…</p>}
      {state === "notfound" && <p role="alert" className="mt-6 text-center text-red-700">{t.notFound}</p>}
      {cert && cert.status !== "active" && <p role="alert" className="mt-6 text-center text-red-700">{t.revoked}</p>}
      {cert && cert.status === "active" && (
        <>
          <p className="mt-6 text-center font-medium text-sage-700 print:hidden">✔ {t.valid}</p>
          <div className="mt-4 rounded border-4 border-double border-gold-400 bg-white p-8 text-center">
            <Image src="/brand/logo-mark.jpg" alt="IQRA CAMPUS" width={90} height={90} className="mx-auto h-24 w-24 object-contain" />
            <p className="mt-2 font-serif text-lg tracking-widest text-sage-900">IQRA CAMPUS</p>
            <h2 className="mt-6 font-serif text-3xl text-gold-600">{t.cert}</h2>
            <p className="mt-6 text-sage-700">{t.certify}</p>
            <p className="mt-2 font-serif text-3xl text-sage-900">{cert.userName}</p>
            <p className="mt-4 text-sage-700">{t.done}</p>
            <p className="mt-2 font-serif text-2xl text-sage-900">{lang === "bn" ? cert.courseTitleBn || cert.courseTitleEn : cert.courseTitleEn}</p>
            {cert.issuedAt && <p className="mt-6 text-sm text-sage-700">{t.issued}: {cert.issuedAt.toDate().toLocaleDateString()}</p>}
            <p className="mt-1 text-xs text-sage-500">{code.trim().toUpperCase()}</p>
          </div>
          <div className="mt-4 text-center print:hidden"><button onClick={() => window.print()} className="rounded border border-sage-300 px-4 py-2">{t.print}</button></div>
        </>)}
    </div>
  );
}
export default function CertificatePage() { return <Suspense fallback={<p className="p-10 text-center">…</p>}><Inner /></Suspense>; }
