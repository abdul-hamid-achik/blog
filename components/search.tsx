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
        }
        ... on Painting {
          _id
          title
          image
          slug
        }
        ... on Page {
          _id
          title
          slug
        }
      }
    }
  }
`;

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
          <CommandGroup heading="Resultados">
            {data?.search?.results?.map((result: Content) => (
              <CommandItem key={result._id} onSelect={() => router.push(`${getBaseURL()}/${result.slugAsParams}`)}>
                <AspectRatio ratio={1}>
                  <Image
                    src={('image' in result && result.image) ? result.image : `${getBaseURL()}/api/og?title=${result.title}`}
                    alt={result.title!}
                    width={200}
                    height={150}
                  />
                </AspectRatio>
                <span>{result.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
};
