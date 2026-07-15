"use client";

import { ChatBubble } from "@/components/chat-bubble";
import { ChatInput } from "@/components/chat-input";
import { ChatMessages, type Message } from "@/components/chat-messages";
import { FREE_MESSAGE_LIMIT } from "@/lib/constants";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LibraryBig, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

function createMessageId() {
  return crypto.randomUUID();
}

function getStoredMessages(locale: string): Message[] {
  try {
    const savedMessages = sessionStorage.getItem(`chat-messages-${locale}`);
    if (!savedMessages) return [];

    const parsed: unknown = JSON.parse(savedMessages);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((message): Message[] => {
      if (!message || typeof message !== "object") return [];

      const candidate = message as Partial<Message>;
      const role = candidate.role;
      const hasValidRole =
        role === "user" || role === "assistant" || role === "system";

      if (!hasValidRole || typeof candidate.content !== "string") return [];

      return [
        {
          id:
            typeof candidate.id === "string" ? candidate.id : createMessageId(),
          role,
          content: candidate.content,
          kind: candidate.kind === "auth" ? "auth" : undefined,
        },
      ];
    });
  } catch {
    console.error("Failed to parse saved chat messages");
    return [];
  }
}

function getOrCreateSessionId() {
  const storedSessionId = sessionStorage.getItem("chat-session-id");
  if (storedSessionId) return storedSessionId;

  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("chat-session-id", sessionId);
  return sessionId;
}

export function Chat() {
  const locale = useLocale();
  const t = useTranslations("Chat");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const suggestions = [
    t("suggestionStart"),
    t("suggestionProjects"),
    t("suggestionEssay"),
  ];
  const hasUserMessage = messages.some((message) => message.role === "user");

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(
        `chat-messages-${locale}`,
        JSON.stringify(messages),
      );
    }
  }, [locale, messages]);

  useEffect(() => {
    const handleCloseChat = () => setIsOpen(false);
    window.addEventListener("close-chat", handleCloseChat);
    return () => window.removeEventListener("close-chat", handleCloseChat);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    }

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [isOpen]);

  const welcomeMessage = (): Message => ({
    id: createMessageId(),
    role: "assistant",
    content: t("welcome"),
  });

  const handleOpenChat = () => {
    sessionIdRef.current ||= getOrCreateSessionId();
    const storedMessages = getStoredMessages(locale);

    setMessages((current) => {
      if (current.length > 0) return current;
      if (storedMessages.length > 0) return storedMessages;
      return [welcomeMessage()];
    });
    setIsOpen(true);
  };

  const updateAssistant = (
    id: string,
    update: (message: Message) => Message,
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id && message.role === "assistant"
          ? update(message)
          : message,
      ),
    );
  };

  const appendAssistantContent = (id: string, content: string) => {
    if (!content) return;
    updateAssistant(id, (message) => ({
      ...message,
      content: message.content + content,
    }));
  };

  const handleSendMessage = async (content: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      content,
    };
    const assistantMessage: Message = {
      id: createMessageId(),
      role: "assistant",
      content: "",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      sessionIdRef.current ||= getOrCreateSessionId();
      const history = messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          locale,
        },
        body: JSON.stringify({
          message: content,
          sessionId: sessionIdRef.current,
          history,
          currentPageUrl: window.location.pathname,
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        updateAssistant(assistantMessage.id, (message) => ({
          ...message,
          kind: "auth",
          content: t("authDescription", { count: FREE_MESSAGE_LIMIT }),
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "[DONE]") return;
          if (data === '{"type":"start"}') continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(data);
          } catch {
            appendAssistantContent(assistantMessage.id, data);
            continue;
          }

          if (
            parsed &&
            typeof parsed === "object" &&
            "error" in parsed &&
            typeof parsed.error === "string"
          ) {
            throw new Error(parsed.error);
          }

          if (typeof parsed === "string") {
            appendAssistantContent(assistantMessage.id, parsed);
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessages((current) =>
          current.filter(
            (message) =>
              message.id !== assistantMessage.id || Boolean(message.content),
          ),
        );
        return;
      }

      console.error("Chat streaming error:", error);
      updateAssistant(assistantMessage.id, (message) => ({
        ...message,
        content: t("error"),
      }));
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleClearChat = () => {
    abortControllerRef.current?.abort();
    sessionStorage.removeItem(`chat-messages-${locale}`);
    setMessages([welcomeMessage()]);
    setIsLoading(false);
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) handleOpenChat();
        else setIsOpen(false);
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <ChatBubble />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[9998] bg-foreground/25 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:bg-transparent sm:backdrop-blur-none motion-reduce:animate-none" />
        <DialogPrimitive.Content className="fixed inset-0 z-[9999] flex h-full w-full flex-col overflow-hidden border-border bg-background shadow-2xl data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 sm:inset-auto sm:right-5 sm:bottom-5 sm:h-[min(680px,calc(100dvh-2.5rem))] sm:w-[440px] sm:rounded-2xl sm:border motion-reduce:animate-none">
          <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid size-9 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                <LibraryBig className="size-4" aria-hidden="true" />
                <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary">
                  {t("title")}
                </p>
                <DialogPrimitive.Title className="truncate text-sm font-semibold text-foreground">
                  {t("personaName")}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  {t("status")}
                </DialogPrimitive.Description>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasUserMessage && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.98]"
                  title={t("clearLabel")}
                  aria-label={t("clearLabel")}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{t("clear")}</span>
                </button>
              )}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.98]"
                  title={t("closeLabel")}
                  aria-label={t("closeLabel")}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </DialogPrimitive.Close>
            </div>
          </header>

          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            suggestions={suggestions}
            onSuggestionSelect={handleSendMessage}
          />

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder={t("placeholder")}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
