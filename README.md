# Abdulachik.dev

This is a personal blog built with [Next.js](https://nextjs.org/) and [Contentlayer2](https://github.com/timlrx/contentlayer2). The blog is a platform to share ideas, experiences, and stories. It features technical posts, reflections on literature and philosophy, and personal narratives. You can visit the blog at [https://www.abdulachik.dev](https://www.abdulachik.dev).

## Development

To start the development server, run the following command:

```bash
bun dev
```

## Codebase Overview

The codebase is structured around Next.js, a React framework, and Contentlayer2, a data layer for modern applications. It uses Apollo for handling GraphQL operations and PGVector for vector search. The blog supports multiple languages and uses `next-intl` for internationalization. The content of the blog (posts, pages, and paintings) is stored in markdown files and processed by Contentlayer2. The blog also features a search functionality that uses Apollo Client to fetch data from a GraphQL server.

## Acknowledgements

This blog was made with <https://github.com/shadcn/next-contentlayer>. Thanks to @shadcn for always making useful stuff.

## Scripts

The `package.json` file contains several scripts for development:

- `dev`: Starts the development server.
- `docker:up`: Starts the Docker Compose.
- `build`: Builds the application for production.
- `preview`: Builds the application and starts a server.
- `start`: Starts the application in production mode.
- `lint`: Lints the codebase.
- `format`: Formats the codebase using Prettier.
- `ingest`: Runs the ingestion script.
- `codegen`: Generates GraphQL types and schemas.
- `postinstall`: Runs after the installation process.

Refer to the `package.json` file for more details.

## Contributing

Contributions are welcome. Feel free to copy and paste this project configuration for your own use. If you borrow from the symphony of words I've composed, please include a note acknowledging the maestro.
