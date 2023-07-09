import { ApolloClient, InMemoryCache } from "@apollo/client"
import { BatchHttpLink } from "@apollo/client/link/batch-http"
import { getBaseURL } from "./utils"

export const uri = `${getBaseURL()}/api/graphql`

const link = new BatchHttpLink({
  uri,
  batchMax: 5,
  batchInterval: 20,
})

export const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
  link,
})
