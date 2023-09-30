"use client"

import { Content } from "@/.generated/graphql";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getBaseURL } from "@/lib/utils";
import { useRouter as useLocalizedRouter } from "@/navigation";
import { gql, useQuery } from "@apollo/client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
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
          title
          image
          slug
          __typename
        }
        ... on Painting {
          _id
          title
          image
          slug
          __typename
        }
        ... on Page {
          _id
          title
          slug
          __typename
        }
      }
    }
  }
`;

function groupByType(results: Content[]) {
  return results.reduce((groups: { [key: string]: Content[] }, result) => {
    const group = result.__typename;
    if (group) {
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(result);
    }
    return groups;
  }, {});
}

export function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations()
  const router = useLocalizedRouter()
  const { data, loading, error } = useQuery(SEARCH_QUERY, {
    fetchPolicy: 'no-cache',
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

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen} >
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
          <Alert variant="destructive">{error.message}</Alert>
        )}
        {data?.search?.results?.length === 0 && (
          <CommandEmpty>
            {t('No results were found but don\'t worry its not your fault')}
          </CommandEmpty>
        )}
        {data?.search?.results?.length > 0 && (
          Object.entries(groupByType(data.search.results)).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item: Content) => (
                <CommandItem key={item._id} onSelect={() => router.push(`${getBaseURL()}/${item.slug}`)}>
                  <AspectRatio ratio={1}>
                    <Image
                      src={('image' in item && item.image) ? item.image : `${getBaseURL()}/api/og?title=${item.title}`}
                      alt={item.title!}
                      width={200}
                      height={150}
                    />
                  </AspectRatio>
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))
        )}
      </CommandList>
    </CommandDialog>
  )
};
