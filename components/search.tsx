"use client"

import { Content } from "@/.generated/graphql";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getBaseURL } from "@/lib/utils";
import { gql, useQuery } from "@apollo/client";
import { useRouter as useLocalizedRouter } from "next-intl/client";
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
  const router = useLocalizedRouter()
  const { data, loading, error } = useQuery(SEARCH_QUERY, {
    fetchPolicy: 'no-cache',
    errorPolicy: "all",
    variables: { query: debouncedSearchTerm },
    skip: !searchTerm,
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
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder="Search..."
        value={searchTerm}
        onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
      />
      <CommandList>
        {loading ? (
          <CommandEmpty>
            <Skeleton className="h-20" />
          </CommandEmpty>
        ) : error ? (
          <CommandEmpty>
            <Alert variant="destructive">{error.message}</Alert>
          </CommandEmpty>
        ) : data?.search?.count === 0 ? (
          <CommandEmpty>
            <Alert>No results found</Alert>
          </CommandEmpty>
        ) : data?.search?.results?.map((result: Content) => (
          <CommandItem onSelect={() => router.push(`${getBaseURL()}/${result.slug}`)} key={result._id}>
            <AspectRatio ratio={4 / 3}>
              <Image
                src={('image' in result && result.image) ? result.image : `${getBaseURL()}/api/og?title=${result.title}`}
                alt={result.title!}
                width={200}
                height={150}
                objectFit="cover"
              />
            </AspectRatio>
            {result.title}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  )
};

