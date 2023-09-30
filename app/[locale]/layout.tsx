import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import Navbar from "@/components/navbar"
import ApolloProvider from "@/components/providers/apollo"
import { IntlProvider } from "@/components/providers/intl"
import { ThemeProvider } from "@/components/providers/theme"
import { Search } from "@/components/search"
import getMessages from '@/i18n'
import { getBaseURL } from "@/lib/utils"
import { locales } from "@/navigation"
import "@code-hike/mdx/dist/index.css"
import { Inter } from "next/font/google"
import { notFound } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Abdul Hamid",
  description: "A Lacanian full-stack developer",
  metadataBase: new URL(getBaseURL()),
}

interface RootLayoutProps {
  children: React.ReactNode
  params: {
    locale: string
  }
}


export function generateStaticParams() {
  return locales.map((locale) => { locale })
}

export default async function LocaleLayout({ children, params }: RootLayoutProps) {
  const { locale } = params

  let messages
  try {
    messages = await getMessages(params);
  } catch (error) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body
        className={`dark:bg-slate-950 min-h-screen bg-white text-slate-900 antialiased dark:text-slate-50 ${inter.className}`}
      >
        <ApolloProvider>
          <IntlProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
                <Navbar locale={locale} />
                <main>{children}</main>
              </div>
              <Search />
              <Analytics />
            </ThemeProvider>
          </IntlProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
