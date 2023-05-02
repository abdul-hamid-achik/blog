import {getRequestConfig} from "next-intl/server"

// TODO: Add missing articles for arabic
// export const locales = ["en", "es", "ru", "ar"]

export const locales = ["en", "es", "ru"]

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./translations/${locale}.json`)).default,
}))
