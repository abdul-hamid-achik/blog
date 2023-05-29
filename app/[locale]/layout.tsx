import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import LocaleSelect from "@/components/locale"
import { ModeToggle } from "@/components/mode-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import "@code-hike/mdx/dist/index.css"
import { Link, useLocale, useTranslations } from "next-intl"
import { Inter } from "next/font/google"

import { notFound } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Abdul Hamid",
  description: "A Lacanian full-stack developer",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
            <header>
              <div className="flex items-center justify-between">
                <ModeToggle />
                <nav className="ml-auto mr-4 space-x-6 text-sm font-medium">
                  <Link href="/">{t("Home")}</Link>
                  {/* TODO: enable hire me link once i figure out how to prevent spam */}
                  {/*<Link href="/hire-me">Hire me</Link>*/}
                  <Link href="/about">{t("About")}</Link>
                </nav>
                <LocaleSelect selected={locale} />
              </div>
            </header>
            <main>{children}</main>
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
