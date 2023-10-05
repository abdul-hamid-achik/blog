import "@/app/globals.css"
import { Analytics } from "@/components/analytics"
import Navbar from "@/components/navbar"
import { ThemeProvider } from "@/components/providers/theme"
import { Search } from "@/components/search"
import { getBaseURL } from "@/lib/utils"
import "@code-hike/mdx/dist/index.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Abdul Hamid",
  description: "A Lacanian full-stack developer",
  metadataBase: new URL(getBaseURL()),
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: RootLayoutProps) {
  return (
    <html>
      <body
        className={`dark:bg-slate-950 min-h-screen bg-white text-slate-900 antialiased dark:text-slate-50 ${inter.className}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="mx-auto max-w-2xl px-4 py-4 md:py-10">
            <Navbar />
            <Search />
            <main>{children}</main>
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

