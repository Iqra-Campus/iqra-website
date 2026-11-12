"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ui, type Locale } from "@/lib/i18n";

const slugs = ["about", "courses", "teachers", "pricing", "reviews", "blog", "contact"] as const;

export default function Header({ lang, path }: { lang: Locale; path: string }) {
  const t = ui[lang];
  const [open, setOpen] = useState(false);
  const switchHref = `/${t.langHref}${path}`;
  const links = [{ href: `/${lang}`, label: t.nav.home }, ...slugs.map((s) => ({ href: `/${lang}/${s}`, label: t.nav[s] }))];

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-gold-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <Image src="/brand/logo-mark.jpg" alt={t.name} width={48} height={48} className="h-12 w-12 object-contain" priority />
          <span className="font-serif text-lg font-semibold tracking-wide text-sage-900">{t.name}</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-sage-700 hover:text-gold-600">{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={switchHref} className="rounded border border-sage-300 px-2 py-1 text-xs text-sage-700 hover:bg-sage-100">{t.langName}</Link>
          <Link href={`/${lang}/login`} className="hidden text-sm text-sage-700 hover:text-gold-600 md:inline">{t.login}</Link>
          <Link href={`/${lang}/trial`} className="hidden rounded bg-sage-700 px-4 py-2 text-sm font-medium text-white hover:bg-sage-900 sm:inline">{t.trial}</Link>
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t.menu} className="rounded border border-sage-300 px-2 py-1 text-sm text-sage-700 lg:hidden">☰</button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-gold-200 bg-white px-4 pb-4 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sage-900">{l.label}</Link></li>
            ))}
            <li><Link href={`/${lang}/login`} onClick={() => setOpen(false)} className="block py-3 text-sage-900">{t.login}</Link></li>
            <li className="pt-2"><Link href={`/${lang}/trial`} onClick={() => setOpen(false)} className="block rounded bg-sage-700 py-3 text-center font-medium text-white">{t.trial}</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
