import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/((?!_next|api|brand|icon.jpg|favicon.ico|.*\\..*).*)"] };
