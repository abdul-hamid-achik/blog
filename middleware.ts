import { locales } from "@/navigation";
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from 'next/server';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};

export default async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';

  const { success } = await ratelimit.limit(
    ip
  );

  if (!success) {
    return NextResponse.redirect(new URL(`/blocked`, request.url));
  }

  const nextIntlMiddleware = createMiddleware({
    locales,
    defaultLocale: "en",
    localePrefix: 'as-needed'
  });

  // @TODO: fix this when types pass correctly
  return nextIntlMiddleware(request as any);
};
