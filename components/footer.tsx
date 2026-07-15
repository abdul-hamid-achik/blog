import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";

const productLinks = [
  ["cortex", "https://cortexai.tools"],
  ["cairntrace", "https://cairntrace.dev"],
  ["glyphrun", "https://glyphrun.dev"],
  ["mcphub", "https://mcphubcli.dev"],
] as const;

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations();
  const footer = useTranslations("Footer");

  return (
    <footer className="mt-16 border-t border-border bg-foreground text-background dark:bg-card dark:text-foreground sm:mt-20">
      <div className="site-shell grid gap-12 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr] md:py-16">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-inverse-accent">
            Abdul Hamid Achik
          </p>
          <p className="mt-5 max-w-md text-2xl font-medium leading-tight tracking-[-0.035em] md:text-3xl">
            {footer("statement")}
          </p>
          <a
            href="mailto:abdulachik@icloud.com"
            className="mt-7 inline-block border-b border-current pb-1 text-sm transition-colors hover:text-inverse-accent"
          >
            abdulachik@icloud.com
          </a>
        </div>

        <div>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-background/55 dark:text-muted-foreground">
            {footer("index")}
          </p>
          <nav
            aria-label={footer("index")}
            className="mt-4 flex flex-col items-start gap-3 text-sm"
          >
            <Link href="/">{t("Home")}</Link>
            <Link href="/projects">{t("Projects")}</Link>
            <Link href="/essays">{t("Essays")}</Link>
            <Link href="/about">{t("About")}</Link>
            <a href={`/rss.xml?locale=${locale}`}>RSS</a>
          </nav>
        </div>

        <div>
          <p className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-background/55 dark:text-muted-foreground">
            {footer("selectedSystems")}
          </p>
          <nav
            aria-label={footer("selectedSystems")}
            className="mt-4 flex flex-col items-start gap-3 text-sm"
          >
            {productLinks.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-background/15 dark:border-border">
        <div className="site-shell flex flex-col gap-3 py-5 font-mono text-[0.62rem] uppercase tracking-[0.13em] text-background/55 dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Abdul Hamid Achik</p>
          <div className="flex gap-5">
            <a
              href="https://github.com/abdul-hamid-achik"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/abdulachik"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
