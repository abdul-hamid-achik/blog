# abdulachik.dev

The source for [abdulachik.dev](https://www.abdulachik.dev): Abdul Hamid Achik's home for independent software, agent-native developer tools, and essays on art, politics, literature, and the unconscious.

The site combines two related archives:

- A project directory led by tools such as cortex, bob, mcphub, monitor, cairntrace, file.cheap, tinyvault, local-agent, and glyphrun.
- A multilingual writing and visual-studies archive built from local MDX content.

## Highlights

- Next.js 16 App Router and React 19.
- English, Spanish, and Russian routes and content through `next-intl`.
- Typed MDX collections for posts, pages, paintings, and AI prompt content.
- A generated `/essays` archive, tag pages, related writing, RSS, sitemap, Open Graph images, and structured data.
- A localized project directory with searchable and filterable project details.
- Static, per-locale search indexes that load only when the command palette opens.
- Responsive editorial layouts, light and dark themes, Geist typography, and Tailwind CSS 4.

## Stack

| Area          | Implementation                                                  |
| ------------- | --------------------------------------------------------------- |
| Application   | Next.js 16, React 19, TypeScript                                |
| Styling       | Tailwind CSS 4, Geist, Radix UI                                 |
| Content       | Content Collections, MDX, Zod                                   |
| Localization  | `next-intl` with EN, ES, and RU                                 |
| Search        | Generated locale JSON indexes and a client-side command palette |
| Data services | Drizzle ORM, Neon/Postgres, pgvector, Redis/KV integrations     |
| Delivery      | Vercel Analytics, Speed Insights, RSS, sitemap, and JSON-LD     |

## Quick start

### Prerequisites

- [Bun](https://bun.sh/) for dependency management and project scripts.
- Node.js 24 LTS (the version pinned by `.node-version` and `.tool-versions`).
- [Cairntrace](https://github.com/abdul-hamid-achik/cairntrace) v1.37.0 and
  [agent-browser](https://agent-browser.dev/) 0.31.1 for the UI suite.
- Credentials for the external services enabled by `env.mjs`.

Clone the repository and install its dependencies:

```bash
git clone https://github.com/abdul-hamid-achik/blog.git
cd blog
bun install
```

Create `.env.local`. The environment schema in `env.mjs` is the source of truth; it currently validates these groups:

| Purpose                   | Variables                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Public application URL    | `NEXT_PUBLIC_APP_URL`                                                                      |
| Database                  | `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |
| KV and rate-limit storage | `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`            |
| Last.fm data              | `LASTFM_API_KEY`, `LASTFM_API_SECRET`, `LASTFM_USERNAME`                                   |
| Email                     | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` (required for inbound forwarding)                |
| Owner-aware concierge     | `SITE_OWNER_EMAIL`, `SITE_INBOUND_EMAIL` (both optional; defaults are documented in code)  |
| Graph metadata            | `APOLLO_KEY`, `APOLLO_GRAPH_REF`                                                           |
| AI Gateway concierge      | `VERCEL_OIDC_TOKEN` or `AI_GATEWAY_API_KEY`                                                |
| OpenAI embeddings         | `OPENAI_API_KEY` (`OPEN_AI_API_KEY` remains a legacy fallback)                             |
| Optional integrations     | `EDGE_CONFIG`                                                                              |

Vercel deployments use the automatically provisioned OIDC token, so an
additional Gateway key is normally unnecessary. To use an API key instead,
link the project and add it as a sensitive environment variable:

```bash
vercel link
vercel env add AI_GATEWAY_API_KEY --sensitive
```

Paste the token when prompted rather than placing it directly in the command.
For local OIDC authentication, refresh the linked project's short-lived token:

```bash
vercel env pull .env.local --yes
```

`vercel env pull` replaces the target file, so preserve any local-only values
before running it. Use `AI_GATEWAY_API_KEY` only where OIDC is unavailable.

Start the content watcher and development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). English uses unprefixed routes; Spanish and Russian use `/es` and `/ru`.

## Content and localization

Content lives under `content/`:

```text
content/
├── pages/       # Editorial and information pages
├── paintings/   # Visual studies and artwork metadata
├── posts/       # Essays and articles
└── prompts/     # Typed prompts used by AI features
```

`content-collections.ts` defines each schema, compiles MDX, derives locale-aware slugs, and calculates reading time for posts. Content Collections exposes the resulting documents through the `content-collections` import.

Use the base filename for English and a locale suffix for translations:

```text
content/posts/example.mdx       # English
content/posts/example.es.mdx    # Spanish
content/posts/example.ru.mdx    # Russian
```

UI messages live in `translations/en.json`, `translations/es.json`, and `translations/ru.json`. Project descriptions use the same three locales through `lib/project-translations.ts`. New user-facing copy should be added to every locale in the same change.

Routing follows `localePrefix: "as-needed"`:

- English: `/`, `/essays`, `/projects`, `/posts/...`
- Spanish: `/es`, `/es/essays`, `/es/projects`, `/es/posts/...`
- Russian: `/ru`, `/ru/essays`, `/ru/projects`, `/ru/posts/...`

Use the navigation helpers in `navigation.ts` and the URL helpers in `lib/site-url.ts` instead of assembling localized URLs by hand.

## Email and concierge contact

Resend delivers verification links and the concierge's explicit contact action.
Only authenticated visitors can ask the concierge to send a real message, the
server supplies their verified address as Reply-To, and a separate daily limit
protects the action from repeated sends.

`hello@abdulachik.dev` is the public address. Resend receives mail for the
domain and calls `/api/webhooks/resend`; the route verifies the raw Svix
signature, filters the recipient, prevents forwarding loops, and passes the
original message and attachments to `SITE_OWNER_EMAIL`. Configure the domain's
sending and receiving DNS records, subscribe the webhook to `email.received`,
and store its one-time signing secret without placing it in shell history:

```bash
vercel env add RESEND_WEBHOOK_SECRET production --sensitive
```

## Projects

The project directory is data-driven:

- `lib/projects.ts` contains project facts, links, stages, proof points, technologies, and feature lists.
- `lib/project-translations.ts` contains localized project narratives.
- `components/projects-view.tsx` provides filtering, search, and expandable details.
- `app/[locale]/projects/page.tsx` supplies localized metadata and the route shell.

Project names, URLs, version claims, and metrics should be verified against their source repositories before they are updated here.

## Search indexing

Global search is a static build artifact; it does not query the GraphQL endpoint.

`bun run content:index` performs two steps:

1. Builds the Content Collections documents.
2. Runs `scripts/generate-search-index.ts` to write `public/search/en.json`, `public/search/es.json`, and `public/search/ru.json`.

Each index includes localized projects, public posts, pages, and paintings. The search dialog fetches the current locale's file on first open, which keeps the initial client bundle independent of the full MDX archive.

Do not edit generated files in `.content-collections/generated/` or `public/search/` directly. Update their source content and rerun `bun run content:index`.

## Architecture

```text
app/
├── [locale]/            # Localized App Router pages and layouts
├── api/                 # Chat, auth, GraphQL, tweet, and OG routes
├── rss.xml/route.ts     # RSS feed
└── sitemap.ts           # Localized sitemap
components/              # Editorial UI, project view, search, MDX, and providers
content/                 # Source MDX
lib/                     # Content access, projects, URLs, data, and integrations
public/search/           # Generated per-locale search indexes
scripts/                 # Search generation and auxiliary data tasks
translations/            # UI messages for EN, ES, and RU
content-collections.ts   # Content schemas and transforms
navigation.ts            # next-intl routing and navigation helpers
proxy.ts                 # Locale routing proxy
```

Most pages are React Server Components. Interactive surfaces such as search, project filters, theme controls, chat, and client-only MDX widgets define their client boundaries explicitly.

## Scripts

| Command                   | Purpose                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `bun run dev`             | Builds the content/search index, watches MDX, and starts Next.js development mode. |
| `bun run content:index`   | Rebuilds Content Collections and all locale search indexes.                        |
| `bun run icons:generate`  | Rebuilds PNG and ICO favicons from `public/favicon.svg`.                           |
| `bun run build`           | Creates the production build.                                                      |
| `bun run start`           | Starts the production server.                                                      |
| `bun run lint`            | Runs ESLint across the repository.                                                 |
| `bun run typecheck`       | Runs TypeScript without emitting files.                                            |
| `bun run test`            | Runs the Vitest suite once.                                                        |
| `bun run test:watch`      | Runs Vitest in watch mode.                                                         |
| `bun run test:coverage`   | Runs unit/integration tests and enforces V8 coverage thresholds.                   |
| `bun run test:e2e:config` | Validates the project-local Cairntrace configuration.                              |
| `bun run test:e2e`        | Builds the app and runs Cairntrace flows with the `agent-browser` backend.         |
| `bun run test:e2e:headed` | Runs the same Cairntrace flows in a visible browser.                               |
| `bun run test:all`        | Runs the coverage gate followed by browser tests.                                  |
| `bun run knip`            | Audits unused files, exports, and dependencies.                                    |
| `bun run check`           | Runs lint, types, tests, and Knip as one verification pass.                        |
| `bun run format`          | Formats the repository with Prettier.                                              |
| `bun run format:check`    | Checks formatting without changing files.                                          |
| `bun run codegen`         | Regenerates GraphQL TypeScript and schema artifacts.                               |
| `bun run generate`        | Generates Drizzle migrations.                                                      |
| `bun run migrate`         | Applies Drizzle migrations.                                                        |
| `bun run studio`          | Opens Drizzle Studio on port 3001.                                                 |
| `bun run push`            | Pushes the Drizzle schema to the configured database.                              |

Before handing off a change, run the checks appropriate to its scope. For a full application change:

```bash
bun run check
bun run format:check
bun run build
```

Lefthook installs during `bun install`. It runs formatting, lint, and tests
before commits, then type-checking and Knip before pushes.

## Quality gates

Vitest measures every runtime module under `lib/` rather than reporting only
files imported by tests, so untouched files cannot disappear from the report.
The repository enforces at least 95% statement, function, and line coverage
plus 88% branch coverage. Safety-critical chat copy is held at 100%, with its
own stricter moderation thresholds. The HTML and LCOV reports are written to
`coverage/`.

Cairntrace exercises critical behavior in desktop and mobile Chromium through
its default `agent-browser` backend: localized navigation, project discovery
and deep links, search, theme state, accessible charts, responsive overflow,
and a deterministic concierge flow. Standalone axe-core checks serious and
critical WCAG failures. Browser-level GraphQL and concierge fixtures keep CI
hermetic, so it never spends AI tokens or depends on a database, model, KV, or
email provider.

GitHub Actions runs both gates for every pull request and uploads coverage,
Cairntrace evidence packs, snapshots, screenshots, and JUnit results when
useful.

## Deployment

Production builds use the same content and search generation pipeline as local builds. Configure the variables from `env.mjs` in the deployment environment, run `bun run build`, and serve the result with `bun run start` or the platform's Next.js runtime.

The canonical production origin is `https://www.abdulachik.dev`.
