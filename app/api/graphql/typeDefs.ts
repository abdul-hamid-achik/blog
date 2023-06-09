import gql from "graphql-tag"

export default gql`
  scalar Date

  type Query {
    allPosts: [Post]
    postsOverTime: [PostsOverTime]
    readingTimeDistribution: [ReadingTimeDistribution]
  }

  type Post {
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

  type Body {
    raw: String
  }

  type Raw {
    sourceFilePath: String
    sourceFileName: String
    sourceFileDir: String
    contentType: String
    flattenedPath: String
  }

  type ReadingTime {
    text: String
    minutes: Float
    time: Int
    words: Int
  }

  type PostsOverTime {
    month: String
    count: Int
  }

  type ReadingTimeDistribution {
    category: String
    count: Int
  }
`
