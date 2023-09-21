import gql from "graphql-tag"

const typeDefs = gql`
extend schema
  @link(
    url: "https://specs.apollo.dev/federation/v2.0"
    import: ["@key", "@shareable"]
  )

scalar Date

"""
The main query object for fetching data
"""
type Query {
  "Fetches all available posts in the blog"
  allPosts: [Post]

  "Fetches all paintings in the blog"
  allPaintings: [Painting]

  "Fetches all available pages in the blog"
  allPages: [Page]

  "Provides post counts categorized by time"
  postsOverTime: [PostsOverTime]

  "Provides the distribution of reading time across various posts"
  readingTimeDistribution: [ReadingTimeDistribution]

  "Performs a semantic search across posts, pages, and paintings in my blog"
  search(query: String!, k: Int): SearchResult

  "Performs a VectorDBQAChain on my content and returns relevant results"
  answer(question: String!, k: Int): QA
}


"A general type of all my content"
union Content = Post | Painting | Page

type SearchResult {
  results: [Content]
  count: Int
}

"""
The QA type is the return of a VectorDBQAChain
"""
type QA {
  question: String
  answer: String
  results: [Content]
  count: Int
}

"""
The Page type, containing all relevant attributes
"""
type Page @key(fields: "_id") {
  title: String
  description: String
  _id: String
  _raw: Raw
  type: String
  slug: String
  slugAsParams: String
  locale: String
}

"""
The Post type, containing all relevant attributes
"""
type Post @key(fields: "_id") {
  title: String
  description: String
  date: Date
  image: String
  tags: [String]
  body: Body
  _id: String
  _raw: Raw
  type: String
  slug: String
  slugAsParams: String
  readingTime: ReadingTime
  locale: String
}

"""
The Painting type, containing all attributes and meta-information
"""
type Painting @key(fields: "_id") {
  title: String
  description: String
  date: Date
  image: String
  tags: [String]
  body: Body
  _id: String
  _raw: Raw
  type: String
  slug: String
  slugAsParams: String
  readingTime: ReadingTime
  locale: String
  author: String
  country: String
  year: Int
}

"""
Body content for a Post or Painting
"""
type Body {
  "Raw body content as a string"
  raw: String
}

"""
Contains raw metadata for a Post or Painting
"""
type Raw {
  "Path to the source file"
  sourceFilePath: String

  "Name of the source file"
  sourceFileName: String

  "Directory where the source file is located"
  sourceFileDir: String

  "Content type for the source file"
  contentType: String

  "Flattened path used for routing"
  flattenedPath: String
}

"""
Reading time metrics for a Post or Painting
"""
type ReadingTime {
  "Textual representation of reading time"
  text: String

  "Reading time in minutes"
  minutes: Float

  "Reading time in seconds"
  time: Int

  "Word count for the post"
  words: Int
}

"""
Aggregated post counts over time, often by month
"""
type PostsOverTime {
  "The month for which the count is aggregated"
  month: String

  "Number of posts in the given month"
  count: Int
}

"""
Categorization of reading time across various posts
"""
type ReadingTimeDistribution {
  "Category name, usually based on time length"
  category: String

  "Number of posts in the category"
  count: Int
}
`

export default typeDefs
