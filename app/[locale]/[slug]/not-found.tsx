import { Link } from "@/navigation"

import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { buttonVariants } from "@/components/ui/button"

import { useTranslations } from "next-intl"

export default function NotFound() {
  const t = useTranslations()
  return (
    <EmptyPlaceholder className="mx-auto max-w-[800px] my-4">
      <EmptyPlaceholder.Icon name="warning" />
      <EmptyPlaceholder.Title>{t("Uh oh! Not Found")}</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        {t("Page could not be found")}.
      </EmptyPlaceholder.Description>
      <Link href="/" className={buttonVariants({ variant: "ghost" })}>
        {t("Go to the main page")}.
      </Link>
    </EmptyPlaceholder>
  )
}
