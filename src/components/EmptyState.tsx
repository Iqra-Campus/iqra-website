import { ui, type Locale } from "@/lib/i18n";

export default function EmptyState({ lang, title }: { lang: Locale; title?: string }) {
  const t = ui[lang];
  return (
    <div className="islamic-pattern mx-auto my-10 max-w-xl rounded border border-gold-200 bg-white p-10 text-center">
      <h2 className="font-serif text-2xl text-sage-900">{title ?? t.emptyTitle}</h2>
      <p className="mt-3 text-sage-700">{t.emptyText}</p>
    </div>
  );
}
