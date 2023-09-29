import { NextIntlClientProvider } from 'next-intl'

export function IntlProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider>{children}</NextIntlClientProvider>
}

export default IntlProvider
