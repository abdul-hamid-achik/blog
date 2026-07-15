"use client";

import { LibraryBig } from "lucide-react";
import { useTranslations } from "next-intl";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ChatBubbleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  unreadCount?: number;
}

export const ChatBubble = forwardRef<HTMLButtonElement, ChatBubbleProps>(
  ({ unreadCount = 0, ...props }, ref) => {
    const t = useTranslations("Chat");

    return (
      <button
        ref={ref}
        type="button"
        className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[9997] flex h-14 items-center justify-center gap-2 rounded-full border border-primary-foreground/15 bg-primary px-4 text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.97] sm:h-12"
        aria-label={t("open")}
        {...props}
      >
        <span className="relative grid size-6 place-items-center">
          <LibraryBig
            className="size-5 transition-transform group-hover:-rotate-3"
            aria-hidden="true"
          />
          <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-primary bg-primary-foreground" />
        </span>
        <span className="hidden text-sm font-medium tracking-tight sm:inline">
          {t("bubbleLabel")}
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground shadow-md">
            {unreadCount}
          </span>
        )}
      </button>
    );
  },
);

ChatBubble.displayName = "ChatBubble";
