import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const pages = ["", "about", "courses", "teachers", "pricing", "reviews", "blog", "faq", "contact", "trial"];
  return ["en", "bn"].flatMap((l) => pages.map((p) => ({ url: `${base}/${l}${p ? `/${p}` : ""}` })));
}
