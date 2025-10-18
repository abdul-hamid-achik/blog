import { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locales } from "@/navigation";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`./translations/${locale}.json`)).default as AbstractIntlMessages,
  };
})
