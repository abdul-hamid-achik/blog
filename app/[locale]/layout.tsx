import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import { Chat } from "@/components/chat"
import Navbar from "@/components/navbar"
import ApolloProvider from "@/components/providers/apollo"
import { IntlProvider } from "@/components/providers/intl"
import { ThemeProvider } from "@/components/providers/theme"
import { Search } from "@/components/search"
import getMessages from '@/i18n'
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import "@code-hike/mdx/dist/index.css"
import { AbstractIntlMessages } from "next-intl"
import { Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Abdul Hamid",
  description: "A Lacanian full-stack developer",
  metadataBase: new URL(getBaseURL()),
}

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}


export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params

  let messages: AbstractIntlMessages
  try {
    messages = (await import(`@/translations/${locale}.json`)).default as AbstractIntlMessages
  } catch {
    notFound()
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`dark:bg-slate-950 min-h-screen bg-white text-slate-900 antialiased dark:text-slate-50 ${inter.className}`}
      >
        <ApolloProvider>
          <IntlProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
                <Navbar />
                <Search />
                <main>{children}</main>
              </div>
              <Chat />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </IntlProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
