import Image from "next/image";
import { ui, type Locale } from "@/lib/i18n";
import { siteContact as c } from "@/config/site";

export default function Footer({ lang }: { lang: Locale }) {
  const t = ui[lang];
  return (
    <footer className="mt-16 border-t border-gold-200 bg-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="flex items-center gap-4">
          <Image src="/brand/logo-full.jpg" alt={t.name} width={120} height={120} className="h-28 w-28 rounded-full object-contain" />
          <div>
            <p className="font-serif text-xl font-semibold text-sage-900">{t.name}</p>
            <p className="text-sm text-sage-700">{t.tagline}</p>
          </div>
        </div>
        <ul className="space-y-1 text-sm text-sage-900">
          <li>{t.email}: <a className="underline" href={`mailto:${c.email}`}>{c.email}</a></li>
          <li>{t.phone}: <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a></li>
          <li><a className="underline" href={c.whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a></li>
          <li><a className="underline" href={c.instagram} target="_blank" rel="noopener noreferrer">{t.instagram}</a></li>
          <li><a className="underline" href={c.facebook} target="_blank" rel="noopener noreferrer">{t.facebook}</a></li>
        </ul>
      </div>
      <nav className="flex flex-wrap justify-center gap-4 pb-4 text-xs text-sage-700" aria-label="Legal">
        <a className="underline" href={`/${lang}/terms`}>{lang === "bn" ? "শর্তাবলি" : "Terms"}</a>
        <a className="underline" href={`/${lang}/privacy`}>{lang === "bn" ? "গোপনীয়তা" : "Privacy"}</a>
        <a className="underline" href={`/${lang}/refund`}>{lang === "bn" ? "রিফান্ড" : "Refund"}</a>
        <a className="underline" href={`/${lang}/faq`}>{lang === "bn" ? "প্রশ্নোত্তর" : "FAQ"}</a>
      </nav>
      <p className="border-t border-gold-200 py-4 text-center text-xs text-sage-700">© {new Date().getFullYear()} {t.name}. {t.rights}</p>
    </footer>
  );
}
