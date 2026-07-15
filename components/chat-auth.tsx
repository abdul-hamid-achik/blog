"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { gql, useMutation } from "@apollo/client";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useId, useState } from "react";

const REQUEST_MAGIC_LINK_MUTATION = gql`
  mutation RequestMagicLink($email: String!) {
    requestMagicLink(email: $email) {
      success
      message
    }
  }
`;

interface ChatAuthProps {
  className?: string;
}

export function ChatAuth({ className }: ChatAuthProps) {
  const t = useTranslations("Chat");
  const emailId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestMagicLink] = useMutation(REQUEST_MAGIC_LINK_MUTATION);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setIsLoading(true);
    setMessage("");

    try {
      const { data } = await requestMagicLink({
        variables: { email: normalizedEmail },
      });

      if (data?.requestMagicLink?.success) {
        setIsSuccess(true);
        setMessage(t("authSuccessDescription"));
      } else {
        setMessage(t("authError"));
      }
    } catch (error) {
      console.error("Error requesting magic link:", error);
      setMessage(t("authError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className={cn(
          "rounded-xl border border-success/30 bg-success/10 p-3.5",
          className,
        )}
        id={statusId}
        role="status"
      >
        <div className="flex items-start gap-2.5">
          <MailCheck
            className="mt-0.5 size-4 shrink-0 text-success"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("authSuccessTitle")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-2.5", className)}
      aria-describedby={message ? statusId : undefined}
    >
      <label htmlFor={emailId} className="sr-only">
        {t("emailLabel")}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
            className="h-10 bg-background pl-9 text-sm"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={!email.trim() || isLoading}
          className="h-10 shrink-0 px-3.5"
        >
          {isLoading ? (
            <Loader2
              className="size-3.5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Mail className="size-3.5" aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">
            {isLoading ? t("sending") : t("sendLink")}
          </span>
        </Button>
      </div>

      {message && (
        <p
          id={statusId}
          className="text-xs leading-relaxed text-destructive"
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
