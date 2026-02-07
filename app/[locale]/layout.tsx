import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import { Chat } from "@/components/chat"
import Footer from "@/components/footer"
import { WebSiteJsonLd } from "@/components/json-ld"
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

const baseUrl = getBaseURL()

export const metadata = {
  title: "Abdul Hamid",
  description: "A Lacanian full-stack developer",
  metadataBase: new URL(baseUrl),
  alternates: {
    types: {
      "application/rss+xml": `${baseUrl}/rss.xml`,
    },
  },
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
      <head>
        <WebSiteJsonLd />
      </head>
      <body
        className={`min-h-screen bg-background text-foreground antialiased ${inter.className}`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ApolloProvider>
          <IntlProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
                <Navbar />
                <Search />
                <main id="main-content">{children}</main>
                <Footer />
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
