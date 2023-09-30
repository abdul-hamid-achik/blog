"use client"

import { DocumentTypes, allDocuments } from "@/.contentlayer/generated";
import { Content } from "@/.generated/graphql";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { getBaseURL } from "@/lib/utils";
import { useRouter as useLocalizedRouter } from "@/navigation";
import { gql, useQuery } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useDebounce } from 'use-debounce';
import { Alert } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

const SEARCH_QUERY = gql`
  query Search($query: String!) {
    search(query: $query) {
      count
      results {
        ... on Content {
          _id
        }
      }
    }
  }
`;

function groupByType(results: DocumentTypes[], locale: string) {
  return results.reduce((groups: { [key: string]: Content[] }, result) => {
    const group = result.type;
    if (group && result.locale === locale) {
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(result);
    }
    return groups;
  }, {});
}

export function Search() {
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations()
  const router = useLocalizedRouter()
  const { data, loading, error } = useQuery(SEARCH_QUERY, {
    errorPolicy: "all",
    variables: { query: debouncedSearchTerm },
    skip: !debouncedSearchTerm,
  });

  const results = useMemo(() => data?.search?.results || [], [data?.search?.results]);
  const count = useMemo(() => data?.search?.count || 0, [data?.search?.count]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        setIsOpen(prevState => !prevState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filter = (value: string, search: string) => {
    const document = allDocuments.filter(doc => doc.locale === locale).find(doc => results.includes(value));

    return document && document.title.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen} filter={filter}>
      <CommandInput
        placeholder="Buscar..."
        value={searchTerm}
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
      />
      <CommandList>
        {loading && (
          <CommandEmpty>
            <Skeleton className="h-20" />
          </CommandEmpty>
        )}
        {error && (
          <CommandEmpty>
            <Alert variant="destructive">{error.message}</Alert>
          </CommandEmpty>
        )}
        {count === 0 && (
          <CommandEmpty>
            {t('No results were found but dont worry its not your fault')}
          </CommandEmpty>
        )}
        {Object.entries(groupByType(allDocuments, locale)).map(([group, items], groupIndex) =>
        (<React.Fragment key={groupIndex}>
          <CommandGroup key={group} heading={group}>
            {items.map((item: Content, itemIndex) => (
              <CommandItem key={`${groupIndex}-${itemIndex}`} onSelect={() => router.push(`${getBaseURL()}/${item.slug}`)} value={item._id!}>
                <div className="flex items-center w-full">
                  <Image
                    src={('image' in item && item.image) ? item.image : `${getBaseURL()}/api/og?title=${item.title}`}
                    alt={item.title!}
                    width={50}
                    height={Math.round(50 * (3 / 4))}
                  />
                  <span className="text-sm text-muted-foreground mx-4 md:block hidden">{item.title}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog >
  )
}
