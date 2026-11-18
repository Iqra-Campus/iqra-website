import { notFound } from "next/navigation";
import { isLocale, ui } from "@/lib/i18n";
import PublicList from "@/components/PublicList";

export default async function Teachers({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{ui[lang].nav.teachers}</h1>
      <PublicList col="teachers" lang={lang} />
    </div>
  );
}
