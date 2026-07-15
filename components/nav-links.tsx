"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/navigation";

interface NavLinkItem {
  href: string;
  label: string;
}

export function NavLinks({
  links,
  label,
  mobile = false,
}: {
  links: readonly NavLinkItem[];
  label: string;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn(
        mobile
          ? "order-3 flex w-full items-center gap-5 overflow-x-auto border-t border-border/70 pt-2 text-sm font-medium md:hidden"
          : "hidden items-center gap-6 text-sm font-medium md:flex",
      )}
    >
      {links.map((link) => {
        const isCurrent =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrent ? "page" : undefined}
            className={cn(
              mobile
                ? "shrink-0 border-b py-1 transition-colors"
                : "relative border-b py-2 transition-colors",
              isCurrent
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
