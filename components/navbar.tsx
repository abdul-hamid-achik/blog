import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import LocaleSelect from "./locale";
import { ModeToggle } from "./mode-toggle";

const Navbar = () => {
  const t = useTranslations();
  const locale = useLocale()

  return (
    <header>
      <div className="flex items-center justify-between">
        <ModeToggle />
        <p className="text-sm text-muted-foreground mx-4 md:block hidden">
          Press{" "}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 mr-2">
            <span className="text-xs">⌘</span>k
          </kbd>
          to search
        </p>
        <nav className="ml-auto mr-2 space-x-6 text-sm font-medium">
          <Link href="/">{t("Home")}</Link>
          {/* <Link href="/contact">{t("Contact")}</Link> */}
          <Link href="/insights">{t("Insights")}</Link>
          {/* <Link href="/paintings">{t("Paintings")}</Link> */}
          {/* <Link href="/music">{t("Music")}</Link> */}
          <Link href="/about">{t("About")}</Link>
        </nav>
        <LocaleSelect selected={locale} />
      </div>
    </header>
  );
};

export default Navbar;
