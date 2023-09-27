import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import LocaleSelect from "@/components/locale"
import { ModeToggle } from "@/components/mode-toggle"
import ApolloProvider from "@/components/providers/apollo"
import { ThemeProvider } from "@/components/providers/theme"
import { Search } from "@/components/search"
import { getBaseURL } from "@/lib/utils"
import "@code-hike/mdx/dist/index.css"
import { useLocale, useTranslations } from "next-intl"
import Link from "next-intl/link"
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

export default function LocaleLayout({ children, params }: RootLayoutProps) {
  const locale = useLocale()
  const t = useTranslations()

  // Show a 404 error if the user requests an unknown locale
  if (params.locale !== locale) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body
        className={`dark:bg-slate-950 min-h-screen bg-white text-slate-900 antialiased dark:text-slate-50 ${inter.className}`}
      >
        <ApolloProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
              <header>
                <div className="flex items-center justify-between">
                  <ModeToggle />
                  <p className="text-sm text-muted-foreground mx-2">
                    Press{" "}
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 mr-2">
                      <span className="text-xs">⌘</span>k
                    </kbd>
                    to search
                  </p>
                  <nav className="ml-auto mr-2 space-x-6 text-sm font-medium">
                    <Link href="/">{t("Home")}</Link>
                    {/* <Link href="/contact">{t("Contact")}</Link> */}
                    {/* <Link href="/insights">{t("Insights")}</Link> */}
                    {/* <Link href="/paintings">{t("Paintings")}</Link> */}
                    <Link href="/about">{t("About")}</Link>
                  </nav>
                  <LocaleSelect selected={locale} />
                </div>
              </header>
              <main>{children}</main>
            </div>
            <Search />
            <Analytics />
          </ThemeProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
