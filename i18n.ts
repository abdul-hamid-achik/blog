import { routing } from "@/navigation";
import { hasLocale, type AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./translations/${locale}.json`))
      .default as AbstractIntlMessages,
  };
});
