import { Search } from "@/components/search";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import LocaleSelect from "./locale";
import { ModeToggle } from "./mode-toggle";
import { NavLinks } from "./nav-links";

const Navbar = () => {
  const t = useTranslations();
  const navigation = useTranslations("Navigation");
  const locale = useLocale();

  const links = [
    { href: "/", label: t("Home") },
    { href: "/projects", label: t("Projects") },
    { href: "/essays", label: t("Essays") },
    { href: "/about", label: t("About") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="site-shell flex min-h-16 flex-wrap items-center gap-x-5 gap-y-2 py-2">
        <Link
          href="/"
          className="group mr-auto inline-flex items-center gap-3 active:scale-[0.98]"
          aria-label={navigation("homeLabel")}
        >
          <span className="grid h-9 w-9 place-items-center border border-foreground bg-foreground font-mono text-[0.7rem] font-semibold tracking-[-0.04em] text-background transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            AH
          </span>
          <span className="hidden leading-none min-[430px]:block">
            <span className="block text-sm font-semibold tracking-[-0.025em]">
              Abdul Hamid Achik
            </span>
            <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
              {navigation("brandSubtitle")}
            </span>
          </span>
        </Link>

        <NavLinks links={links} label={navigation("primaryLabel")} />

        <div className="flex items-center gap-2">
          <Search key={locale} locale={locale} />
          <ModeToggle />
          <LocaleSelect selected={locale} />
        </div>

        <NavLinks links={links} label={navigation("mobileLabel")} mobile />
      </div>
    </header>
  );
};

export default Navbar;
