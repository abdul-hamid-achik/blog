"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export interface EssayArchiveItem {
  id: string;
  title: string;
  description?: string | null;
  formattedDate?: string | null;
  readingTime: string;
  tags: string[];
  href: string;
}

export function EssayArchive({ items }: { items: EssayArchiveItem[] }) {
  const t = useTranslations("EssaysPage");
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (!normalizedQuery) return items;

    return items.filter((item) =>
      [item.title, item.description ?? "", ...item.tags]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [items, query]);

  return (
    <section aria-labelledby="essay-archive-heading">
      <div className="grid gap-5 border-y border-border py-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label
            htmlFor="essay-search"
            className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground"
          >
            {t("searchLabel")}
          </label>
          <input
            id="essay-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="mt-2 block h-11 w-full border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring sm:w-[28rem]"
          />
        </div>
        <p
          id="essay-archive-heading"
          className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground"
          aria-live="polite"
        >
          {t("count", { count: visibleItems.length })}
        </p>
      </div>

      {visibleItems.length > 0 ? (
        <div className="divide-y divide-border border-b border-border">
          {visibleItems.map((item, index) => (
            <article
              key={item.id}
              className="group grid gap-4 py-7 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start"
            >
              <span className="font-mono text-[0.62rem] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <Link href={item.href}>
                  <h2 className="text-2xl font-semibold leading-tight tracking-[-0.04em] transition-colors group-hover:text-primary sm:text-3xl">
                    {item.title}
                  </h2>
                </Link>
                {item.description && (
                  <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.tags.slice(0, 5).map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="border border-border px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground sm:text-right">
                {item.formattedDate && <span>{item.formattedDate}</span>}
                {item.formattedDate && (
                  <span className="mx-2 text-border">/</span>
                )}
                <span>{item.readingTime}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="border-b border-dashed border-border py-16 text-center text-muted-foreground">
          {t("empty")}
        </p>
      )}
    </section>
  );
}
