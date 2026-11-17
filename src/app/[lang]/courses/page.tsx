import { notFound } from "next/navigation";
import { isLocale, ui } from "@/lib/i18n";
import PublicList from "@/components/PublicList";

export default async function Courses({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl text-sage-900">{ui[lang].nav.courses}</h1>
      <PublicList col="courses" lang={lang} />
    </div>
  );
}
