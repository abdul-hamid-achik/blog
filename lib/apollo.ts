import { ApolloClient, InMemoryCache } from "@apollo/client"
import { BatchHttpLink } from "@apollo/client/link/batch-http"
import { setContext } from "@apollo/client/link/context"
import { useLocale } from "next-intl"
import { getBaseURL } from "./utils"

export const uri = `${getBaseURL()}/api/graphql`

const localeLink = setContext((_, { headers }) => {
  const locale = useLocale()

  return {
    headers: {
      ...headers,
      locale: locale,
    },
  }
})

const link = localeLink.concat(
  new BatchHttpLink({
    uri,
    batchMax: 5,
    batchInterval: 20,
  })
)

export const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
  link,
})
