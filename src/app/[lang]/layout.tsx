import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale, locales, ui } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";

export function generateStaticParams() { return locales.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${ui[lang].name} | ${ui[lang].tagline}`, description: ui[lang].heroText };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} dir="ltr">
      <body className="font-sans">
        <Header lang={lang} path="" />
        <AuthProvider><main>{children}</main></AuthProvider>
        <Footer lang={lang} />
      </body>
    </html>
  );
}
