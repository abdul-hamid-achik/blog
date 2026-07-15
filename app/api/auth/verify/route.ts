import { createUser, setAuthCookie, verifyToken } from "@/lib/auth";
import { getLocalizedPath, type SiteLocale } from "@/lib/site-url";
import { isProduction } from "@/lib/utils";
import { routing } from "@/routing";
import { NextRequest, NextResponse } from "next/server";

function resolveLocale(locale: string | null): SiteLocale {
  return (
    routing.locales.find((supportedLocale) => supportedLocale === locale) ??
    routing.defaultLocale
  );
}

function redirectToLocalizedHome(
  request: NextRequest,
  locale: SiteLocale,
  searchParams: Record<string, string>,
) {
  const redirectUrl = new URL(getLocalizedPath(locale), request.url);

  for (const [key, value] of Object.entries(searchParams)) {
    redirectUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = resolveLocale(searchParams.get("locale"));
  const token = searchParams.get("token");

  try {
    if (!token) {
      return redirectToLocalizedHome(request, locale, {
        error: "invalid-token",
      });
    }

    const email = await verifyToken(token);

    if (!email) {
      return redirectToLocalizedHome(request, locale, {
        error: "invalid-token",
      });
    }

    const userId = await createUser(email);

    await setAuthCookie(userId);

    if (!isProduction) {
      console.log("Magic-link authentication completed");
    }

    return redirectToLocalizedHome(request, locale, {
      verified: "true",
    });
  } catch (error) {
    console.error("Error in magic link verification:", error);
    return redirectToLocalizedHome(request, locale, {
      error: "verification-failed",
    });
  }
}
