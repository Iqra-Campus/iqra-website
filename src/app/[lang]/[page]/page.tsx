import { notFound } from "next/navigation";
import { isLocale, ui } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import PublicList from "@/components/PublicList";
import PublicPage from "@/components/PublicPage";
import { siteContact as c } from "@/config/site";

const known = ["about", "courses", "teachers", "pricing", "reviews", "contact", "faq", "terms", "privacy", "refund", "trial", "login"] as const;
type Slug = (typeof known)[number];

export default async function Page({ params }: { params: Promise<{ lang: string; page: string }> }) {
  const { lang, page } = await params;
  if (!isLocale(lang) || !(known as readonly string[]).includes(page)) notFound();
  const t = ui[lang];
  const slug = page as Slug;
  const title = slug === "trial" ? t.trial : slug === "login" ? t.login : slug === "faq" ? (lang === "bn" ? "প্রশ্নোত্তর" : "FAQ") : slug === "terms" ? (lang === "bn" ? "শর্তাবলি" : "Terms & Conditions") : slug === "privacy" ? (lang === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy") : slug === "refund" ? (lang === "bn" ? "রিফান্ড নীতি" : "Refund Policy") : t.nav[slug];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{title}</h1>
      {slug === "contact" ? (
        <ul className="mx-auto mt-8 max-w-md space-y-3 rounded border border-gold-200 bg-white p-6 text-sage-900">
          <li>{t.email}: <a className="underline" href={`mailto:${c.email}`}>{c.email}</a></li>
          <li>{t.phone}: <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a></li>
          <li><a className="underline" href={c.whatsapp} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a></li>
          <li><a className="underline" href={c.instagram} target="_blank" rel="noopener noreferrer">{t.instagram}</a></li>
          <li><a className="underline" href={c.facebook} target="_blank" rel="noopener noreferrer">{t.facebook}</a></li>
        </ul>
      ) : slug === "about" || slug === "pricing" || slug === "terms" || slug === "privacy" || slug === "refund" ? (
        <PublicPage id={slug} lang={lang} />
      ) : slug === "courses" || slug === "teachers" || slug === "faq" || slug === "reviews" ? (
        <PublicList col={slug === "faq" ? "faqs" : slug === "reviews" ? "reviews" : slug} lang={lang} />
      ) : (
        <EmptyState lang={lang} />
      )}
    </div>
  );
}
