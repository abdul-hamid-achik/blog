import { NextIntlClientProvider } from 'next-intl';

export function IntlProvider({ children, ...props }: { children: React.ReactNode; locale: string; messages: any }) {
  return <NextIntlClientProvider {...props}>{children}</NextIntlClientProvider>
}

export default IntlProvider
