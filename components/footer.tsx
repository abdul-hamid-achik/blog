import { Link } from "@/navigation"
import { useTranslations } from "next-intl"

export default function Footer() {
  const t = useTranslations()

  return (
    <footer className="border-t border-border py-6 mt-12">
      <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
        <nav className="flex gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("Home")}
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t("About")}
          </Link>
          <Link href="/insights" className="hover:text-foreground transition-colors">
            {t("Insights")}
          </Link>
          <Link href="/projects" className="hover:text-foreground transition-colors">
            {t("Projects")}
          </Link>
          <a
            href="/rss.xml"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            RSS
          </a>
        </nav>
        <p>&copy; {new Date().getFullYear()} Abdul Hamid Achik</p>
      </div>
    </footer>
  )
}
