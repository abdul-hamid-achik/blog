import { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./translations/${locale}.json`)).default as AbstractIntlMessages,
}))
