"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePathname } from "@/navigation";
import { getLocaleSwitchPath, getLocalizedPath } from "@/lib/site-url";
import { useTranslations } from "next-intl";

const locales = ["en", "es", "ru"];
type Locale = "en" | "es" | "ru";

function getLocaleName(locale: Locale) {
  switch (locale) {
    case "en":
      return "English";
    case "es":
      return "Español";
    case "ru":
      return "Русский";
    default:
      return locale;
  }
}

export default function LocaleSelect({ selected }: { selected: string }) {
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  function changeLanguage(locale: Locale) {
    const suffix = `${window.location.search}${window.location.hash}`;
    const destination = getLocalizedPath(locale, getLocaleSwitchPath(pathname));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";

    // Keep next-intl's locale detection in sync before navigating to the
    // unprefixed default locale. Otherwise an existing ES/RU preference can
    // immediately redirect `/projects` back to the previous language.
    document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    window.location.assign(`${destination}${suffix}`);
  }

  return (
    <Select value={selected} onValueChange={changeLanguage}>
      <div className="flex flex-col">
        <SelectTrigger
          className="h-9 w-16 rounded-none border-border bg-card px-2 font-mono text-[0.65rem] uppercase tracking-[0.12em]"
          aria-label={t("changeLanguage")}
        >
          <SelectValue placeholder={t("selectLanguage")}>
            {selected.toUpperCase()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem
              key={locale}
              value={locale}
              className="cursor-pointer text-xs hover:bg-accent"
            >
              {`${locale.toUpperCase()} · ${getLocaleName(locale as Locale)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </div>
    </Select>
  );
}
