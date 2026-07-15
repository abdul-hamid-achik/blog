import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "ru"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export const locales = routing.locales;
