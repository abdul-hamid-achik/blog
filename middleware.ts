import { locales } from "@/navigation";
import { siteRateLimiter } from '@/lib/rate-limit';
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from 'next/server';
import { isProduction } from '@/lib/utils';

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};

export default async function middleware(request: NextRequest) {
  // Defense-in-depth: strip internal Next.js headers that could be used
  // to bypass middleware (CVE-2025-29927)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-middleware-subrequest');

  // Create a new request with sanitized headers
  const sanitizedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
  });

  const nextIntlMiddleware = createMiddleware({
    locales,
    defaultLocale: "en",
    localePrefix: 'as-needed'
  });

  // Skip rate limiting in development
  if (!isProduction) {
    return nextIntlMiddleware(sanitizedRequest as any);
  }

  // Use Vercel's trusted IP header first, fall back to x-forwarded-for
  const ip = sanitizedRequest.headers.get('x-real-ip')
    ?? sanitizedRequest.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? '127.0.0.1';

  const { success } = await siteRateLimiter.limit(ip);

  if (!success) {
    return NextResponse.redirect(new URL(`/blocked`, sanitizedRequest.url));
  }

  return nextIntlMiddleware(sanitizedRequest as any);
};
