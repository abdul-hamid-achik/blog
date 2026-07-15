import { routing } from "@/navigation";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

const handleI18nRouting = createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}
