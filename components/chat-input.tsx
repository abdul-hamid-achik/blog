"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARACTERS = 500;

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const t = useTranslations("Chat");
  const inputId = useId();
  const hintId = useId();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remainingCharacters = MAX_CHARACTERS - message.length;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [message]);

  const handleSend = () => {
    const content = message.trim();
    if (!content || disabled) return;

    onSend(content);
    setMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="border-t border-border bg-card/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:p-4 sm:pb-4">
      <label htmlFor={inputId} className="sr-only">
        {t("inputLabel")}
      </label>
      <div className="rounded-xl border border-border bg-background p-2 shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <Textarea
          id={inputId}
          ref={textareaRef}
          autoFocus
          value={message}
          maxLength={MAX_CHARACTERS}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("placeholder")}
          disabled={disabled}
          className="max-h-32 min-h-12 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-relaxed text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
          aria-describedby={hintId}
        />
        <div className="flex items-center justify-between gap-3 pt-1 pl-2">
          <div
            id={hintId}
            className="min-w-0 text-[0.68rem] text-muted-foreground"
          >
            <span className="hidden sm:inline">{t("inputHint")}</span>
            {message.length > MAX_CHARACTERS - 60 && (
              <span className="sm:ml-2" aria-live="polite">
                {t("charactersLeft", { count: remainingCharacters })}
              </span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="size-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow-xs transition-transform hover:bg-primary/90 active:scale-[0.96]"
            aria-label={t("send")}
          >
            {disabled ? (
              <Loader2
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-center text-[0.62rem] leading-relaxed text-muted-foreground">
        {t("disclaimer")}
      </p>
    </footer>
  );
}
