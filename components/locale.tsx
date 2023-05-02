"use client"

import { locales } from "@/i18n"
import { useRouter } from "next/navigation"
import { usePathname } from "next-intl/client"
import { Listbox } from "@headlessui/react"

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
export default function LocaleSelect({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  function changeLanguage(locale: Locale) {
    router.push(`/${locale}${pathname ? `/${pathname}` : ""}`)
  }

  return (
    <Listbox value={current} onChange={changeLanguage}>
      <Listbox.Button>{`${getLocaleFlag(current as Locale)} ${getLocaleName(
        current as Locale
      )}`}</Listbox.Button>
      <Listbox.Options className="ml-2 px-4 py-2">
        {locales
          .filter((locale) => locale !== current)
          .map((locale) => (
            <Listbox.Option
              key={locale}
              value={locale}
              className="cursor-pointer px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              {`${getLocaleFlag(locale as Locale)} ${getLocaleName(
                locale as Locale
              )}`}
            </Listbox.Option>
          ))}
      </Listbox.Options>
    </Listbox>
  )
}
