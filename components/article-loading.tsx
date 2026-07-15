import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export function ArticleLoading() {
  const t = useTranslations("ArticleLoading");

  return (
    <div className="reading-shell py-16 sm:py-24" aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        {t("status")}
      </span>
      <div aria-hidden="true">
        <div className="border-b border-border pb-10">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-7 h-12 w-full max-w-2xl sm:h-16" />
          <Skeleton className="mt-4 h-6 w-4/5 max-w-xl" />
        </div>
        <div className="space-y-4 pt-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
