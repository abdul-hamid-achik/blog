import { routing } from "../routing";
import { getBaseURL } from "./utils";

export type SiteLocale = (typeof routing.locales)[number];

/**
 * Builds an internal path using the same `as-needed` locale strategy as
 * next-intl: the default locale is unprefixed, while other locales are prefixed.
 */
export function getLocalizedPath(locale: SiteLocale | string, pathname = "/") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedPath = path === "/" ? "" : path;
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${localePrefix}${normalizedPath}` || "/";
}

/**
 * Chooses a safe equivalent route when changing languages. Tag labels are
 * translated content rather than stable slugs, so their closest reliable
 * cross-locale destination is the localized essay archive.
 */
export function getLocaleSwitchPath(pathname: string | null | undefined) {
  const path = pathname || "/";
  const localePrefix = routing.locales.join("|");
  const tagPath = new RegExp(`^/(?:(${localePrefix})/)?tags(?:/|$)`, "i");

  return tagPath.test(path) ? "/essays" : path;
}

/** Builds an absolute site URL from a locale and an internal path. */
export function getLocalizedUrl(
  locale: SiteLocale | string,
  pathname = "/",
  baseUrl = getBaseURL(),
) {
  return `${baseUrl.replace(/\/$/, "")}${getLocalizedPath(locale, pathname)}`;
}

/** Builds a localized Open Graph image URL without hand-assembling a query. */
export function getOgImageUrl(
  title: string,
  locale: SiteLocale | string,
  baseUrl = getBaseURL(),
) {
  const url = new URL("/api/og", baseUrl);
  url.searchParams.set("title", title);
  url.searchParams.set("locale", locale);
  return url.toString();
}
