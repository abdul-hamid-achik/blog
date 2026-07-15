"use client";

import { createApolloClient } from "@/lib/apollo";
import { ApolloProvider } from "@apollo/client";
import { useMemo, type ReactNode } from "react";

interface NextApolloProviderProps {
  children: ReactNode;
  locale: string;
}

export default function NextApolloProvider({
  children,
  locale,
}: NextApolloProviderProps) {
  const client = useMemo(() => createApolloClient(locale), [locale]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
