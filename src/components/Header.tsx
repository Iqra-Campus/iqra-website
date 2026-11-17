"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ui, type Locale } from "@/lib/i18n";

const slugs = ["about", "courses", "teachers", "pricing", "reviews", "blog", "contact"] as const;

export default function Header({ lang }: { lang: Locale; path?: string }) {
  const pathname = usePathname() || `/${lang}`;
  const path = pathname.replace(/^\/(en|bn)/, "");
  const t = ui[lang];
  const switchHref = `/${t.langHref}${path}`;
  const links = [{ href: `/${lang}`, label: t.nav.home }, ...slugs.map((s) => ({ href: `/${lang}/${s}`, label: t.nav[s] }))];

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-gold-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <Image src="/brand/logo-mark.jpg" alt={t.name} width={48} height={48} className="h-12 w-12 object-contain" priority />
          <span className="font-serif text-base font-semibold leading-tight tracking-wide text-navy-900 sm:text-lg">{t.name}</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-sage-700 hover:text-gold-600">{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={switchHref} className="rounded border border-sage-300 px-2 py-1 text-xs text-sage-700 hover:bg-sage-100">{t.langName}</Link>
          <Link href={`/${lang}/login`} className="hidden text-sm text-sage-700 hover:text-gold-600 md:inline">{t.login}</Link>
          <Link href={`/${lang}/trial`} className="whitespace-nowrap rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">{lang === "bn" ? "ফ্রি ট্রায়াল" : "Free Trial"}</Link>
        </div>
      </div>

    </header>
  );
}
