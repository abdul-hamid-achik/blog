"use client"

import { client } from "@/lib/apollo";
import { ApolloProvider } from "@apollo/client";

export default function NextApolloProvider({children}: any) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
