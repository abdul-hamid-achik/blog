import { Link } from "@/navigation";

import { EmptyPlaceholder } from "@/components/empty-placeholder";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <EmptyPlaceholder className="reading-shell my-16 border border-dashed border-border py-16 sm:my-24">
      <EmptyPlaceholder.Icon name="warning" />
      <EmptyPlaceholder.Title>{t("title")}</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        {t("painting")}
      </EmptyPlaceholder.Description>
      <Link href="/" className={buttonVariants({ variant: "ghost" })}>
        {t("home")}
      </Link>
    </EmptyPlaceholder>
  );
}
