"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ui, type Locale } from "@/lib/i18n";
import { siteContact } from "@/config/site";

const I = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  book: <path d="M4 5a2 2 0 012-2h6v16H6a2 2 0 00-2 2zM20 5a2 2 0 00-2-2h-6v16h6a2 2 0 012 2z" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M12 11v6M9 14h6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  wa: <path d="M3 21l1.6-4.6A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1zM9 8c0 4 3 7 7 7l1-2-2-1-1 .8c-1-.4-2-1.4-2.4-2.4L12 9.5l-1-2z" />,
};
const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export default function BottomNav({ lang }: { lang: Locale }) {
  const t = ui[lang];
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  const home = `/${lang}`;
  const links = [
    { href: `/${lang}/about`, label: t.nav.about }, { href: `/${lang}/courses`, label: t.nav.courses }, { href: `/${lang}/teachers`, label: t.nav.teachers },
    { href: `/${lang}/pricing`, label: t.nav.pricing }, { href: `/${lang}/reviews`, label: t.nav.reviews }, { href: `/${lang}/blog`, label: t.nav.blog },
    { href: `/${lang}/faq`, label: lang === "bn" ? "প্রশ্নোত্তর" : "FAQ" }, { href: `/${lang}/contact`, label: t.nav.contact }, { href: `/${lang}/login`, label: t.login },
  ];
  const item = (active: boolean) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-navy-900" : "text-sage-700"}`;
  return (
    <>
      <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-200 bg-white/95 backdrop-blur lg:hidden print:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-md items-end">
          <Link href={home} className={item(path === home)}><Icon d={I.home} />{t.nav.home}</Link>
          <Link href={`/${lang}/courses`} className={item(path.endsWith("/courses"))}><Icon d={I.book} />{t.nav.courses}</Link>
          <Link href={`/${lang}/trial`} className="relative -mt-6 flex flex-1 flex-col items-center gap-0.5 pb-2 text-[11px] font-semibold text-navy-900">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gold-400 text-navy-900 shadow-lg"><Icon d={I.cal} /></span>
            {lang === "bn" ? "ফ্রি ট্রায়াল" : "Free Trial"}
          </Link>
          <a href={siteContact.whatsapp} target="_blank" rel="noopener noreferrer" className={item(false) + " text-green-700"}><Icon d={I.wa} />{t.whatsapp}</a>
          <button onClick={() => setOpen(true)} className={item(open)} aria-haspopup="dialog" aria-expanded={open}><Icon d={I.menu} />{t.menu}</button>
        </div>
      </nav>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.menu}>
          <button className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-white p-5" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
            <ul className="grid grid-cols-2 gap-2">
              {links.map((l) => <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block rounded-lg border border-gold-200 px-4 py-3 text-sage-900">{l.label}</Link></li>)}
            </ul>
            <Link href={`/${t.langHref}${path.replace(/^\/(en|bn)/, "")}`} onClick={() => setOpen(false)} className="mt-3 block rounded-lg bg-navy-900 py-3 text-center text-white">{t.langName}</Link>
          </div>
        </div>)}
    </>
  );
}
