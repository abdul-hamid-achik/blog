"use client"

import { locales } from "@/i18n"
import { useRouter } from "next/navigation"
import { usePathname } from "next-intl/client"
import { Listbox, Transition } from "@headlessui/react"

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
    router.push(`/${locale}${pathname ? `/${pathname}` : ""}`)
  }

  return (
    <Listbox value={selected} onChange={changeLanguage}>
      {({ open }) => (
        <div className="flex flex-col">
          <Listbox.Button className="md:text-md text-sm">{`${getLocaleFlag(
            selected as Locale
          )} ${getLocaleName(selected as Locale)}`}</Listbox.Button>
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Listbox.Options className="px-2 py-1 md:px-4 md:py-2" static>
              {locales
                .filter((locale) => locale !== selected)
                .map((locale) => (
                  <Listbox.Option
                    key={locale}
                    value={locale}
                    className="cursor-pointer px-2 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 md:px-4 md:py-2"
                  >
                    {`${getLocaleFlag(locale as Locale)} ${getLocaleName(
                      locale as Locale
                    )}`}
                  </Listbox.Option>
                ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}
