import { locales } from "@/navigation";
import { siteRateLimiter } from '@/lib/rate-limit';
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from 'next/server';
import { isProduction } from '@/lib/utils';

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};

export default async function middleware(request: NextRequest) {
  const nextIntlMiddleware = createMiddleware({
    locales,
    defaultLocale: "en",
    localePrefix: 'as-needed'
  });

  // Skip rate limiting in development
  if (!isProduction) {
    return nextIntlMiddleware(request as any);
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';

  const { success } = await siteRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.redirect(new URL(`/blocked`, request.url));
  }

  return nextIntlMiddleware(request as any);
};
