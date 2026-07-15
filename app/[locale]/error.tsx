"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="reading-shell py-20 sm:py-28">
      <div className="border-y border-border py-12 text-center">
        <p className="eyebrow">500</p>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-muted-foreground">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center border border-border bg-card px-5 text-sm font-semibold transition-colors hover:border-foreground/40"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
