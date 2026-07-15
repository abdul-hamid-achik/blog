"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { SearchDocument, SearchDocumentKind } from "@/lib/search";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

function groupDocuments(documents: SearchDocument[]) {
  return documents.reduce<Record<SearchDocumentKind, SearchDocument[]>>(
    (groups, document) => {
      groups[document.kind].push(document);
      return groups;
    },
    { Writing: [], Page: [], Painting: [], Project: [] },
  );
}

export function Search({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<SearchDocument[] | null>(null);
  const router = useRouter();
  const t = useTranslations();
  const dialog = useTranslations("SearchDialog");
  const groups = useMemo(() => groupDocuments(documents ?? []), [documents]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen || documents !== null) return;

    const controller = new AbortController();

    fetch(`/search/${locale}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Search index returned ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((result) => setDocuments(Array.isArray(result) ? result : []))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDocuments([]);
        }
      });

    return () => controller.abort();
  }, [documents, isOpen, locale]);

  function selectDocument(document: SearchDocument) {
    router.push(document.href);
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t("Search")}
        className="inline-flex h-9 items-center gap-2 border border-border bg-card px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground active:scale-[0.98]"
      >
        <span>{t("Search")}</span>
        <kbd className="hidden border-l border-border pl-2 text-[0.62rem] text-muted-foreground sm:inline">
          ⌘ K
        </kbd>
      </button>

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        dialogTitle={dialog("title")}
        dialogDescription={dialog("description")}
        closeLabel={dialog("close")}
      >
        <CommandInput
          aria-label={t("Search the archive")}
          placeholder={t("Search the archive")}
        />
        <CommandList>
          <CommandEmpty>
            {documents === null
              ? dialog("loading")
              : t("No results were found but dont worry its not your fault")}
          </CommandEmpty>

          {(
            Object.entries(groups) as [SearchDocumentKind, SearchDocument[]][]
          ).map(([kind, items], groupIndex) =>
            items.length > 0 ? (
              <div key={kind}>
                {groupIndex > 0 && <CommandSeparator />}
                <CommandGroup heading={dialog(`groups.${kind}`)}>
                  {items.map((document) => (
                    <CommandItem
                      key={document.id}
                      value={`${document.title} ${document.description ?? ""}`}
                      onSelect={() => selectDocument(document)}
                      className="group gap-4 rounded-none border-b border-border/60 py-3 last:border-0"
                    >
                      <span className="w-10 shrink-0 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-primary">
                        {dialog(`groups.${kind}`).slice(0, 3)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">
                          {document.title}
                        </span>
                        {document.description && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground group-aria-selected:text-foreground">
                            {document.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ) : null,
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
