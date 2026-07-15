import { ApolloClient, InMemoryCache } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";

export function createApolloClient(locale: string) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new BatchHttpLink({
      uri: "/api/graphql",
      batchMax: 5,
      batchInterval: 20,
      headers: { locale },
    }),
  });
}
