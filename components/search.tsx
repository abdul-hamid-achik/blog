"use client"

import { allPages, allPaintings, allPosts } from "content-collections";

const allDocuments = [...allPosts, ...allPages, ...allPaintings];
import { Content } from "@/.generated/graphql";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading, CommandSeparator } from "@/components/ui/command";
import { getBaseURL } from "@/lib/utils";
import { useRouter as useLocalizedRouter } from "@/navigation";
import { gql, useQuery } from "@apollo/client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDebounce } from 'use-debounce';
import { Alert } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";

const SEARCH_QUERY = gql`
  query Search($query: String!) {
    search(query: $query) {
      count
      results {
        ... on Post {
          _id
        }
        ... on Painting {
          _id
        }
        ... on Page {
          _id
        }
      }
    }
  }
`;

type DocumentType = typeof allDocuments[number];

function groupByType(results: DocumentType[], locale: string) {
  return results.reduce((groups: { [key: string]: Content[] }, result) => {
    const group = result._meta.path.split("/")[0];
    if (group && result.locale === locale) {
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(result as any);
    }
    return groups;
  }, {});
}

const CommandItemComponent = ({ document, handleSelect }: { document: DocumentType | Content, handleSelect: (document: DocumentType | Content) => () => void }) => {
  const key = '_meta' in document ? document._meta.path : document.__typename || '';
  return (
    <CommandItem key={key} onSelect={handleSelect(document)} value={key}>
      <div className="flex items-center w-full">
        <Image
          src={('image' in document && document.image) ? document.image : `${getBaseURL()}/api/og?title=${encodeURIComponent(document.title!)}`}
          alt={document.title!}
          width={64}
          height={Math.round(64 * (3 / 4))}
          style={{
            width: 'auto',
            height: 'auto'
          }}
        />
        <span className="text-sm text-muted-foreground mx-4 md:block hidden">{document.title}</span>
      </div>
    </CommandItem>
  )
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

  const handleSelect = (document: Content) => () => {
    router.push(`${getBaseURL()}/${document.slug}`)
    setIsOpen(false)
  }

  const shouldFilter = data?.search?.count === 0

  const filter = (value: string, search: string) => {
    if (value.includes(search)) return 1
    return 0
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen} filter={filter} shouldFilter={shouldFilter}>
      <CommandInput
        placeholder="Buscar..."
        value={searchTerm}
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
      />
      {loading && (
        <CommandLoading>
          <Skeleton className="h-20" />
        </CommandLoading>
      )}
      <CommandList>
        <CommandEmpty>
          {t('No results were found but dont worry its not your fault')}
        </CommandEmpty>

        {error && (<CommandItem>
          <Alert variant="destructive">{error.message}</Alert>
        </CommandItem>)}

        {data?.search?.results && data?.search?.count > 0 && (
          <CommandGroup heading="Suggestions">
            {data.search.results.map(({ _id }: Content) => {
              const document = allDocuments.find(doc => doc._meta.path === _id && doc.locale === locale);
              return document ? (
                <CommandItemComponent document={document} handleSelect={handleSelect} key={document._meta.path} />
              ) : null;
            })}
          </CommandGroup>)}

        {Object.entries(groupByType(allDocuments, locale)).map(([group, items], groupIndex) =>
        (<React.Fragment key={groupIndex}>
          <CommandGroup key={group} heading={group}>
            {items.map((item: Content) => (
              <CommandItemComponent document={item} handleSelect={handleSelect} key={item.slug} />
            ))}
          </CommandGroup>
          <CommandSeparator />
        </React.Fragment>))}
      </CommandList>
    </CommandDialog >
  )
}

