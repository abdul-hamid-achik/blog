"use client";

import { ChatAuth } from "@/components/chat-auth";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUpRight,
  ExternalLink,
  LibraryBig,
  Loader2,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UrlTransform } from "streamdown";

const MessageResponse = dynamic(
  () =>
    import("@/components/ai-elements/message").then(
      (module) => module.MessageResponse,
    ),
  {
    ssr: false,
    loading: () => <span className="text-muted-foreground">…</span>,
  },
);

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  kind?: "auth";
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
  suggestions?: string[];
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const safeUrlTransform: UrlTransform = (value) => {
  if (value.startsWith("/") || value.startsWith("#")) return value;

  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? value : null;
  } catch {
    return null;
  }
};

type ContentPart =
  | { type: "text"; content: string }
  | { type: "link"; path: string; label: string };

function parseMessageContent(
  content: string,
  fallbackLabel: string,
): ContentPart[] {
  const parts: ContentPart[] = [];
  const expression = /\[NAVIGATE:(\/[^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "link",
      path: match[1],
      label: fallbackLabel,
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", content }];
}

function AssistantMessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const t = useTranslations("Chat");
  const parts = useMemo(
    () => parseMessageContent(content, t("pageLink")),
    [content, t],
  );

  return (
    <div className="min-w-0 space-y-2 break-words">
      {parts.map((part, index) => {
        if (part.type === "link") {
          return (
            <Link
              key={`${part.path}-${index}`}
              href={part.path}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary active:scale-[0.98]"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("close-chat"))
              }
            >
              <ExternalLink className="size-3" aria-hidden="true" />
              {part.label}
            </Link>
          );
        }

        return (
          <MessageResponse
            key={`text-${index}`}
            className="[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_code]:font-mono [&_pre]:max-w-full"
            disallowedElements={["img"]}
            mode={isStreaming ? "streaming" : "static"}
            skipHtml
            urlTransform={safeUrlTransform}
          >
            {part.content}
          </MessageResponse>
        );
      })}
    </div>
  );
}

export function ChatMessages({
  messages,
  isLoading = false,
  onSuggestionSelect,
  suggestions = [],
}: ChatMessagesProps) {
  const t = useTranslations("Chat");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const visibleMessages = messages.filter(
    (message) => message.role !== "system",
  );
  const lastMessage = visibleMessages.at(-1);
  const showSuggestions =
    !isLoading && visibleMessages.length === 1 && suggestions.length > 0;

  useEffect(() => {
    if (visibleMessages.length !== previousMessageCountRef.current) {
      shouldAutoScrollRef.current = true;
      setShowJumpToLatest(false);
      previousMessageCountRef.current = visibleMessages.length;
    }

    if (!shouldAutoScrollRef.current) return;

    const frame = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    });

    return () => cancelAnimationFrame(frame);
  }, [isLoading, lastMessage?.content, visibleMessages.length]);

  const scrollToLatest = () => {
    shouldAutoScrollRef.current = true;
    setShowJumpToLatest(false);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    messagesEndRef.current?.scrollIntoView({
      block: "end",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="relative min-h-0 flex-1 bg-background">
      <div
        ref={scrollContainerRef}
        role="log"
        aria-busy={isLoading}
        aria-live="polite"
        aria-relevant="additions text"
        className="h-full space-y-5 overflow-y-auto px-4 py-5 sm:px-5"
        onScroll={(event) => {
          const container = event.currentTarget;
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            80;

          shouldAutoScrollRef.current = isNearBottom;
          setShowJumpToLatest(!isNearBottom);
        }}
      >
        {visibleMessages.length === 0 && !isLoading && (
          <div className="grid h-full place-items-center py-12 text-center">
            <div className="max-w-[18rem] space-y-3">
              <div className="mx-auto grid size-10 place-items-center rounded-full border border-border bg-card text-primary">
                <LibraryBig className="size-4" aria-hidden="true" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          </div>
        )}

        {visibleMessages.map((message) => {
          const isEmptyAssistant =
            message.role === "assistant" && !message.content;
          if (isEmptyAssistant) return null;

          const isAssistant = message.role === "assistant";
          const isStreaming = isLoading && message.id === lastMessage?.id;

          return (
            <article
              key={message.id}
              className={cn(
                "flex w-full items-start gap-2.5",
                isAssistant ? "justify-start" : "justify-end",
              )}
            >
              {isAssistant && (
                <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card text-primary shadow-xs">
                  <LibraryBig className="size-3.5" aria-hidden="true" />
                </div>
              )}

              <div
                className={cn(
                  "min-w-0 max-w-[86%] text-sm",
                  isAssistant
                    ? "pt-1 text-foreground"
                    : "rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-xs",
                )}
              >
                {message.kind === "auth" ? (
                  <div className="space-y-3 rounded-xl border border-warning/35 bg-warning/10 p-3.5 text-foreground">
                    <div className="flex items-center gap-2 text-warning">
                      <Lock className="size-4" aria-hidden="true" />
                      <span className="font-medium">{t("authRequired")}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {message.content}
                    </p>
                    <ChatAuth />
                  </div>
                ) : isAssistant ? (
                  <AssistantMessageContent
                    content={message.content}
                    isStreaming={isStreaming}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            </article>
          );
        })}

        {showSuggestions && (
          <section
            aria-label={t("suggestionsLabel")}
            className="ml-9 space-y-2.5"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("suggestionsLabel")}
            </p>
            <div className="grid gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs leading-snug text-foreground transition-colors hover:border-primary/40 hover:bg-accent active:scale-[0.98]"
                  onClick={() => onSuggestionSelect?.(suggestion)}
                >
                  <span>{suggestion}</span>
                  <ArrowUpRight
                    className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {isLoading && !lastMessage?.content && (
          <div className="flex items-center gap-2.5 pl-9 text-sm text-muted-foreground">
            <Loader2
              className="size-3.5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>{t("thinking")}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showJumpToLatest && (
        <button
          type="button"
          onClick={scrollToLatest}
          className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-colors hover:border-primary/50 hover:text-primary"
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          {t("jumpLatest")}
        </button>
      )}
    </div>
  );
}
