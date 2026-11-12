import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/en/admin", "/bn/admin", "/en/teacher", "/bn/teacher", "/en/parent", "/bn/parent", "/en/pay", "/bn/pay", "/en/login", "/bn/login"] }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
