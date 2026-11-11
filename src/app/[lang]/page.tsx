import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import HomeHero from "@/components/HomeHero";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <HomeHero lang={lang} />;
}
