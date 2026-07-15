"use client";

import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuthNotice() {
  const t = useTranslations("HomePage");
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const error = searchParams.get("error");

  const notice =
    searchParams.get("verified") === "true"
      ? { kind: "success" as const, message: t("authVerified") }
      : error === "invalid-token"
        ? { kind: "error" as const, message: t("authInvalidToken") }
        : error === "verification-failed"
          ? { kind: "error" as const, message: t("authVerificationFailed") }
          : null;

  if (!notice || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.hash}`,
    );
  };

  return (
    <div className="site-shell border-x border-border px-5 pt-5 sm:px-8 lg:px-12">
      <div
        className={cn(
          "flex items-start justify-between gap-4 border px-4 py-3 text-sm",
          notice.kind === "success"
            ? "border-success/30 bg-success/10 text-foreground"
            : "border-destructive/30 bg-destructive/10 text-foreground",
        )}
        role={notice.kind === "success" ? "status" : "alert"}
      >
        <div className="flex items-start gap-2.5">
          {notice.kind === "success" ? (
            <CircleCheck
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          )}
          <p className="leading-relaxed">{notice.message}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="-m-1 shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t("dismissNotice")}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
