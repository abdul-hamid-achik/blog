import { AbstractIntlMessages, NextIntlClientProvider, } from 'next-intl';

interface Props { children: React.ReactNode; locale: string; messages: AbstractIntlMessages }

export function IntlProvider({ children, ...props }: Props) {
  return <NextIntlClientProvider {...props}>{children}</NextIntlClientProvider>
}

export default IntlProvider
