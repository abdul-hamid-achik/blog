"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { usePathname } from "next-intl/client"
import { useRouter } from "next/navigation"

const locales = ["en", "es", "ru"]
type Locale = "en" | "es" | "ru" | "ar"

function getLocaleName(locale: Locale) {
  switch (locale) {
    case "en":
      return "English"
    case "es":
      return "Español"
    case "ru":
      return "Русский"
    case "ar":
      return "العربية"
    default:
      return locale
  }
}

function getLocaleFlag(locale: Locale) {
  switch (locale) {
    case "en":
      return "🇬🇧"
    case "es":
      return "🇲🇽"
    case "ru":
      return "🇷🇺"
    case "ar":
      return "🇸🇾"
  }
}
export default function LocaleSelect({ selected }: { selected: string }) {
  const router = useRouter()
  const pathname = usePathname()
  function changeLanguage(locale: Locale) {
    console.log("changeLanguage", locale)
    router.push(`/${locale}${pathname ? `/${pathname}` : ""}`)
  }

  return (
    <Select value={selected} onValueChange={changeLanguage}>
      <div className="flex flex-col">
        <SelectTrigger className="md:text-md text-sm">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem
              key={locale}
              value={locale}
              className="cursor-pointer px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 md:px-4 md:py-2"
            >
              {`${getLocaleFlag(locale as Locale)} ${getLocaleName(
                locale as Locale
              )}`}
            </SelectItem>
          ))}
        </SelectContent>
      </div>
    </Select>
  )
}
