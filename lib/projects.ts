export interface Project {
  name: string;
  description: string;
  longDescription: string;
  category: "product" | "cli" | "library" | "neovim-plugin";
  tech: string[];
  github?: string;
  website?: string;
  featured: boolean;
  stage?: string;
  proof?: string;
  features: string[];
}

export const flagshipProjectOrder = [
  "cortex",
  "bob",
  "mcphub",
  "cairntrace",
  "glyphrun",
  "tinyvault",
  "monitor",
  "file.cheap",
  "local-agent",
  "Blueprint",
] as const;

export function getProjectAnchor(name: string) {
  const slug = name
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `project-${slug}`;
}

export const projects: Project[] = [
  // Agent-native systems
  {
    name: "cortex",
    description: "Evidence-guided agent kernel for long-running software work",
    longDescription:
      "A local-first control plane for software-engineering agents. Cortex preserves goals, evidence, bounded changes, verification results, and durable memory so long tool-using sessions stay inspectable and recoverable.",
    category: "cli",
    tech: ["Go", "MCP", "Bubble Tea", "Cobra", "VitePress"],
    github: "https://github.com/abdul-hamid-achik/cortex",
    website: "https://cortexai.tools",
    featured: true,
    stage: "v0.12.0",
    proof: "17-tool compact MCP profile · 24-tool operator profile",
    features: [
      "Durable goals, task state, and structured memory",
      "Evidence-backed verification and bounded changes",
      "CLI, MCP server, and interactive Studio",
      "Local-first operation with auditable artifacts",
    ],
  },
  {
    name: "bob",
    description: "Deterministic repository factory for agent-native tools",
    longDescription:
      "Turns a small bob.yaml product contract into a reviewable repository plan, then applies only the files it can prove it owns. Bob is model-free, drift-aware, and designed to make generated foundations safe to review and maintain.",
    category: "cli",
    tech: ["Go", "YAML", "MCP", "Bubble Tea", "Cobra"],
    github: "https://github.com/abdul-hamid-achik/bob",
    website: "https://bobcli.dev",
    featured: true,
    stage: "Early alpha",
    proof: "Atomic ownership checks · 6 typed MCP tools",
    features: [
      "Contract-first repository planning from bob.yaml",
      "Atomic apply blocked by any ownership conflict",
      "Drift detection for generated foundations in CI",
      "Read-only Studio and typed MCP interface",
    ],
  },
  {
    name: "mcphub",
    description: "One local gateway for every MCP server and agent harness",
    longDescription:
      "Define MCP servers once, expose their tools through a single namespaced gateway, and safely synchronize the same configuration into every supported coding-agent harness. Local usage intelligence makes the invisible tool layer observable.",
    category: "cli",
    tech: ["Go", "MCP", "SQLite", "Bubble Tea", "VitePress"],
    github: "https://github.com/abdul-hamid-achik/mcphub",
    website: "https://mcphubcli.dev",
    featured: true,
    stage: "Shipping",
    proof: "12 agent harnesses · 7-tool lazy management surface",
    features: [
      "One source of truth for MCP server configuration",
      "Namespaced gateway with lazy tool discovery",
      "Safe synchronization across 12 agent harnesses",
      "Local usage history, health, and diagnostics",
    ],
  },
  // Featured Products
  {
    name: "LinkGlow",
    description: "Browser extension for link auditing and SEO analysis",
    longDescription:
      "Chrome + Firefox extension that visually highlights and classifies internal/external links on any page. Privacy-first with local processing, optional cloud sync, and AI-powered features.",
    category: "product",
    tech: ["TypeScript", "React 19", "Next.js", "Chrome MV3", "Firefox MV2"],
    website: "https://linkglow.io",
    featured: true,
    features: [
      "Visual link classification with customizable highlights",
      "Domain grouping & AI-powered suggestions",
      "Privacy-first, all local processing",
    ],
  },
  {
    name: "hitspec",
    description: "File-based HTTP API testing framework",
    longDescription:
      "Write API tests as plain .http files with 26 assertion operators, built-in stress testing, and a web UI. Single binary, CI/CD-ready.",
    category: "product",
    tech: ["Go", "Vue 3", "Cobra CLI"],
    github: "https://github.com/abdul-hamid-achik/hitspec",
    website: "https://hitspec.dev",
    featured: true,
    features: [
      "26 assertion operators with snapshot testing",
      "Built-in stress testing & metrics dashboard",
      "CI/CD integration with GitHub Actions",
    ],
  },
  {
    name: "Vue Native",
    description: "Build native iOS & Android apps with Vue 3",
    longDescription:
      "Write Vue 3 components that render real native views — no WebView, no compromise. Supports Composition API, 20+ built-in components, native modules, hot reload, and cross-platform from a single codebase.",
    category: "product",
    tech: ["TypeScript", "Swift", "Kotlin", "Vue 3"],
    github: "https://github.com/abdul-hamid-achik/vue-native",
    website: "https://vue-native.dev",
    featured: true,
    features: [
      "Real native UI — no DOM, no WebView",
      "20+ components, native modules & navigation",
      "Cross-platform iOS & Android from one codebase",
    ],
  },
  {
    name: "Blueprint",
    description: "Declarative language for writing web services",
    longDescription:
      "A declarative programming language that compiles .bp files to runnable TypeScript projects. Write a spec, get a working API powered by Hono, Drizzle, and Zod. No boilerplate, no lock-in.",
    category: "product",
    tech: ["Go", "TypeScript", "Hono", "Drizzle", "Zod"],
    github: "https://github.com/abdul-hamid-achik/blueprint",
    website: "https://blueprint-lang.dev",
    featured: true,
    features: [
      "Intent-first .bp syntax compiles to TypeScript",
      "Generates Hono + Drizzle + Zod projects",
      "Built-in validation, pagination & error handling",
    ],
  },
  {
    name: "Tarot Agent",
    description: "Free AI-powered tarot card readings with Claude",
    longDescription:
      "Get free AI tarot readings with 6 spread types — Single Card, Yes/No, Three Card, Love, Career, and Celtic Cross. Features custom pixel-art Major Arcana illustrations and streaming interpretations powered by Claude AI.",
    category: "product",
    tech: ["Nuxt 3", "Vue 3", "Tailwind CSS", "Claude AI"],
    website: "https://tarotagent.app",
    featured: true,
    features: [
      "6 spread types including Celtic Cross",
      "Streaming AI interpretations by Claude",
      "Custom pixel-art Major Arcana illustrations",
    ],
  },
  // Open Source Tools
  {
    name: "noted",
    description: "CLI knowledge base & MCP server",
    longDescription:
      "Fast CLI for capturing and organizing notes with tagging, full-text & semantic search, and a memory system for AI agents via MCP.",
    category: "cli",
    tech: ["Go", "SQLite", "MCP"],
    github: "https://github.com/abdul-hamid-achik/noted",
    featured: false,
    features: [
      "Tagging, full-text & semantic search",
      "Memory system with categories & TTL",
      "12 MCP tools for AI integration",
    ],
  },
  {
    name: "noted.nvim",
    description: "Contextual note-taking for Neovim",
    longDescription:
      "Note-taking plugin with wiki-links, daily notes, quick capture, and Telescope integration. Notes live in a centralized vault accessible from any project.",
    category: "neovim-plugin",
    tech: ["Lua", "Neovim"],
    github: "https://github.com/abdul-hamid-achik/noted.nvim",
    featured: false,
    features: [
      "Wiki-style [[links]] with autocomplete",
      "Daily notes & quick capture window",
      "Telescope & nvim-cmp integration",
    ],
  },
  {
    name: "haiku.nvim",
    description: "AI code completion with Claude Haiku",
    longDescription:
      "Inline ghost-text code completion powered by Claude Haiku. Progressive acceptance, LSP/Treesitter context awareness, and minimal latency.",
    category: "neovim-plugin",
    tech: ["Lua", "Neovim", "Anthropic API"],
    github: "https://github.com/abdul-hamid-achik/haiku.nvim",
    featured: false,
    features: [
      "Inline ghost text suggestions",
      "Progressive acceptance (word/line/block)",
      "LSP & Treesitter context awareness",
    ],
  },
  {
    name: "vecai",
    description: "AI-powered codebase assistant",
    longDescription:
      "Combines semantic code search with local LLM intelligence via Ollama. Ask questions about your codebase and get contextual answers.",
    category: "cli",
    tech: ["Go", "Ollama"],
    github: "https://github.com/abdul-hamid-achik/vecai",
    featured: false,
    features: [
      "Semantic code search + local LLM",
      "Contextual Q&A about your codebase",
      "Works offline with Ollama models",
    ],
  },
  {
    name: "veclite",
    description: "Embeddable vector database with HNSW and hybrid search",
    longDescription:
      "Embeddable vector database for Go. Single-file persistence, HNSW indexing, hybrid search (vector + BM25), streaming results, metadata filtering, and 55 MCP tools. Designed to be embedded in other Go applications with zero external runtime dependencies.",
    category: "library",
    tech: ["Go", "HNSW", "BM25", "MCP"],
    github: "https://github.com/abdul-hamid-achik/veclite",
    website: "https://veclite.dev",
    featured: true,
    features: [
      "HNSW indexing for fast approximate nearest neighbor search",
      "Hybrid search combining vector similarity and BM25 text search",
      "55 MCP tools for AI agent integration",
      "Single-file persistence with zero external runtime dependencies",
    ],
  },
  {
    name: "vecgrep",
    description: "Semantic code search with vector embeddings",
    longDescription:
      "Local-first semantic code search powered by embeddings. Index your codebase and search by meaning, not just keywords. Defaults to local Ollama embeddings with optional cloud providers. Hybrid mode, MCP server, studio UI, and similar code finder.",
    category: "cli",
    tech: ["Go", "Ollama", "MCP", "Bubble Tea"],
    github: "https://github.com/abdul-hamid-achik/vecgrep",
    website: "https://vecgrep.dev",
    featured: true,
    features: [
      "Hybrid search combining semantic and keyword search",
      "Local-first via Ollama, optional cloud providers",
      "MCP server for AI assistant integration",
      "Studio UI, similar code finder, and search diagnostics",
    ],
  },
  {
    name: "file.cheap",
    description: "Local-first evidence stash for agent-generated files",
    longDescription:
      "Save, restore, compress, index, search, and connect agent-generated files and folders back to code. A single local binary keeps bulky evidence addressable without turning repositories into artifact dumps.",
    category: "cli",
    tech: ["Go", "MCP", "SQLite", "Zstandard", "BM25"],
    github: "https://github.com/abdul-hamid-achik/file.cheap",
    website: "https://file.cheap",
    featured: true,
    stage: "Shipping",
    proof: "14 MCP tools · automatic compression above 10 MB",
    features: [
      "Content-addressed local stashes for files and folders",
      "Compression, indexing, restoration, and evidence search",
      "Links generated artifacts back to the code that produced them",
      "Homebrew, Debian, and go install distribution",
    ],
  },
  {
    name: "tinyvault",
    description: "Local secrets management with AES-256-GCM and MCP",
    longDescription:
      "Dead-simple local secrets manager for developers and AI agents. Single Go binary with AES-256-GCM encryption, Argon2id key derivation, versioned secrets with history and rollback, X25519 recipient sharing, .env.encrypted files safe to commit, git-filter transparent interpolation, local unix agent for passphrase-free daily use, relational search, interactive terminal studio, access policy YAML, and 49 MCP tools.",
    category: "cli",
    tech: ["Go", "AES-256-GCM", "Argon2id", "bbolt", "MCP"],
    github: "https://github.com/abdul-hamid-achik/tinyvault",
    website: "https://tinyvault.dev",
    featured: true,
    stage: "Shipping",
    proof: "49 MCP tools · six OS/architecture release targets",
    features: [
      "AES-256-GCM + Argon2id with two-tier key hierarchy",
      "Versioned secrets, X25519 recipient sharing, git-filter integration",
      "Interactive terminal studio (Bubble Tea v2)",
      "49 MCP tools with access policy YAML for AI agent permissions",
    ],
  },
  {
    name: "vidtrace",
    description: "Turn bug videos into timestamped evidence bundles",
    longDescription:
      "Local-first Go CLI that takes a screen recording of a bug and produces frames, OCR text, transcripts, metadata, and a timeline that connects what was visible with what was said. Designed for QA engineers, developers, and coding agents that cannot watch a video directly but can inspect files and JSON.",
    category: "cli",
    tech: ["Go", "Cobra CLI", "OCR", "Whisper"],
    github: "https://github.com/abdul-hamid-achik/vidtrace",
    website: "https://vidtrace.dev",
    featured: true,
    features: [
      "Frame extraction, per-frame OCR, and unified timeline.json",
      "SRT, VTT, JSON, and TSV transcript outputs",
      "VecLite BM25 evidence search across bundles",
      "Homebrew tap distribution and stable JSON contracts for automation",
    ],
  },
  {
    name: "cairntrace",
    description: "Browser behavior spec runner for coding agents",
    longDescription:
      "Local-first behavioral browser-spec layer for coding agents. Specs define intent + outcomes as the behavior contract and steps as repairable hints. The same spec can run from the CLI, through the MCP server, or be exported to Playwright. Captures DOM snapshots, screenshots, console, network, and outcome evidence into one agent-readable artifact pack.",
    category: "cli",
    tech: ["TypeScript", "Bun", "YAML", "MCP", "Playwright"],
    github: "https://github.com/abdul-hamid-achik/cairntrace",
    website: "https://cairntrace.dev",
    featured: true,
    stage: "v1.37.0",
    proof: "Browser evidence packs · locator-drift healing",
    features: [
      "YAML behavior specs with intent/outcome contracts",
      "DOM snapshots, screenshots, console, and network capture",
      "MCP server and Playwright export from the same spec",
      "Locator drift healing without changing the behavior contract",
    ],
  },
  {
    name: "glyphrun",
    description: "Terminal app behavior runner with PTY and artifact packs",
    longDescription:
      "Local-first behavior runner for terminal applications. Launches a target command inside a real PTY, drives it from YAML/JSON steps, evaluates outcomes against a deterministic virtual terminal screen, and writes self-contained artifact packs. Full xterm control set support including SGR colors, OSC 8 hyperlinks, and mouse input. Runs on Unix PTYs and Windows ConPTY.",
    category: "cli",
    tech: ["Go", "PTY", "YAML", "MCP"],
    github: "https://github.com/abdul-hamid-achik/glyphrun",
    website: "https://glyphrun.dev",
    featured: true,
    stage: "v0.1 surface complete",
    proof: "Unix PTY + Windows ConPTY · JUnit and BATS interchange",
    features: [
      "Black-box PTY execution — if it runs in a terminal, glyphrun can drive it",
      "YAML/JSON behavior specs with contract hashes and snapshots",
      "Recording, replay, run diffs, BATS import/export, and JUnit output",
      "MCP stdio server for coding agent integration",
    ],
  },
  {
    name: "termina",
    description: "Strategic turn-based MOBA for chess-like battles",
    longDescription:
      "Text-based multiplayer online battle arena where strategy matters more than reflexes. 5v5 turn-based combat on 4-second ticks with 18 programming-themed heroes, 40+ items, talent trees, draft phase, deny system, buyback, vision game, and anti-cheat with leaver detection and low-priority queue.",
    category: "product",
    tech: ["Nuxt 4", "Vue 3", "Effect-TS", "PostgreSQL", "Redis", "Bun"],
    github: "https://github.com/abdul-hamid-achik/termina",
    featured: true,
    features: [
      "18 programming-themed heroes with distinct abilities",
      "40+ items, talent trees, and snake draft pick phase",
      "Anti-cheat: leaver detection, low-priority queue, stat validation",
      "Redis state persistence with auto-recovery after restart",
    ],
  },
  {
    name: "ClipIt.now",
    description: "AI-powered video clipping platform",
    longDescription:
      "Transform long-form video into shareable clips using AI. Upload footage, describe your clipping needs in natural language, and receive professionally cut segments within minutes. Built for content creators, marketers, and media teams who need to produce clips at scale without manual editing.",
    category: "product",
    tech: ["Nuxt", "Vue 3", "Tailwind CSS", "AI/ML"],
    website: "https://clipit.now",
    featured: true,
    features: [
      "Natural language clip descriptions",
      "Upload up to 2GB of video",
      "AI-powered segment extraction in minutes",
    ],
  },
  {
    name: "musicpractice",
    description: "Music learning app with tablature and audio playback",
    longDescription:
      "Helps musicians structure their practice with interactive tablature, audio playback, and progress tracking. Built with Nuxt 4 and powered by AlphaTab for high-fidelity tab rendering and Tone.js for audio synthesis.",
    category: "product",
    tech: ["Nuxt 4", "Vue 3", "AlphaTab", "Tone.js"],
    website: "https://musicpractice.tech",
    github: "https://github.com/abdul-hamid-achik/musicpractice",
    featured: true,
    features: [
      "Interactive tablature rendering with AlphaTab",
      "Audio playback and synthesis with Tone.js",
      "Structured practice sessions with progress tracking",
    ],
  },
  {
    name: "reservadoc",
    description: "Document reservation platform with role-based access",
    longDescription:
      "Document reservation platform for managing document workflows with role-based access and real-time status tracking. Built with Bun, Turborepo, TypeScript, and PostgreSQL.",
    category: "product",
    tech: ["Bun", "Turbo", "TypeScript", "PostgreSQL"],
    website: "https://reservadoc.app",
    github: "https://github.com/abdul-hamid-achik/reservadoc",
    featured: true,
    features: [
      "Role-based access control for document workflows",
      "Real-time status tracking",
      "Monorepo architecture with Turborepo",
    ],
  },
  {
    name: "blankcode",
    description: "Interactive fill-in-the-blank coding exercises",
    longDescription:
      "Interactive learning platform that teaches programming through targeted practice. Instead of open-ended exercises, learners fill in strategically blanked-out code, building muscle memory for syntax and patterns. Supports multiple languages with a growing library of exercises.",
    category: "product",
    tech: ["Bun", "Vue 3", "NestJS", "TypeScript", "PostgreSQL"],
    github: "https://github.com/abdul-hamid-achik/blankcode",
    featured: true,
    features: [
      "Fill-in-the-blank coding challenges",
      "Multiple language support",
      "Growing exercise library",
    ],
  },
  {
    name: "tarot-tcg",
    description: "Tactical card game combining tarot and TCG mechanics",
    longDescription:
      "Tactical card game that combines tarot symbolism with trading card game mechanics. Built with Next.js 15 and React 19.",
    category: "product",
    tech: ["Next.js 15", "React 19", "TypeScript"],
    github: "https://github.com/abdul-hamid-achik/tarot-tcg",
    featured: false,
    features: [
      "Tarot symbolism meets TCG gameplay",
      "Tactical card-based combat",
    ],
  },
  {
    name: "gpeek",
    description: "Git visualization tool for humans and LLMs",
    longDescription:
      "Git visualization tool designed for both humans and LLMs. Clean, parseable output of repository state and history.",
    category: "cli",
    tech: ["Go", "TUI"],
    github: "https://github.com/abdul-hamid-achik/gpeek",
    featured: false,
    features: [
      "Clean, parseable git output",
      "Designed for both human and LLM consumption",
    ],
  },
  {
    name: "rosewood",
    description:
      "Native macOS code editor in Swift and SwiftUI (docs coming soon)",
    longDescription:
      "Lightweight native macOS code editor built with Swift and SwiftUI/AppKit. VS Code-like editing experience with multi-tab editing, syntax highlighting for 20+ languages, LSP integration, DAP debugger, project-wide search, command palette, git integration, code folding, minimap, and session persistence. Multiple themes including Nord, GitHub Light, and Dracula.",
    category: "product",
    tech: ["Swift", "SwiftUI", "AppKit", "LSP", "DAP"],
    github: "https://github.com/abdul-hamid-achik/rosewood",
    featured: true,
    features: [
      "Multi-tab editing with LSP autocomplete and diagnostics",
      "DAP debugger with breakpoints and debug console",
      "Git integration with branch status and diff preview",
      "Interactive minimap and code folding",
    ],
  },
  {
    name: "local-agent",
    description: "Local-first terminal coding agent powered by Ollama",
    longDescription:
      "A terminal coding agent with approval-gated tools, MCP integrations, durable goals, expert consultation, and optional workspace-scoped memory. It runs against local Ollama models and keeps resumable sessions in SQLite.",
    category: "cli",
    tech: ["Go", "Ollama", "MCP", "Bubble Tea"],
    github: "https://github.com/abdul-hamid-achik/local-agent",
    website: "https://local-agent.dev",
    featured: true,
    stage: "Alpha",
    proof: "NORMAL, PLAN, and AUTO modes · lossless SQLite resume",
    features: [
      "100% local — no API keys, no cloud, no data leaving your device",
      "Approval-gated tools and durable, resumable goals",
      "STDIO, SSE, and Streamable HTTP MCP support",
      "Read-only Team, Swarm, and MoE expert consultation",
    ],
  },
  {
    name: "teak",
    description: "Terminal code editor built with Go (docs coming soon)",
    longDescription:
      "Modern terminal code editor with a VS Code-like experience. Multi-tab editing, syntax highlighting for 40+ languages via Chroma, LSP support, file tree sidebar, git panel, text and semantic search, Lua plugins, live file watching, immutable rope-backed undo/redo, full mouse support, and Nord theme with 30+ styles.",
    category: "cli",
    tech: ["Go", "Bubble Tea", "LSP", "Lua"],
    github: "https://github.com/abdul-hamid-achik/teak",
    featured: true,
    features: [
      "Multi-tab editor with LSP, file tree, and git panel",
      "Syntax highlighting for 40+ languages via Chroma",
      "Lua plugins with commands, keymaps, and autocmds",
      "Semantic search via vecgrep integration",
    ],
  },
  {
    name: "monitor",
    description: "Agent-harnessable system monitor for macOS and Linux",
    longDescription:
      "The same real-time runtime data through a polished terminal UI, stable JSON commands, and an MCP server. Monitor covers CPU, memory, disks, network, sensors, services, containers, and processes on macOS and Linux.",
    category: "cli",
    tech: ["Go", "MCP", "Charm", "Bubble Tea", "gopsutil"],
    github: "https://github.com/abdul-hamid-achik/monitor",
    website: "https://monitorcli.dev",
    featured: true,
    stage: "Shipping",
    proof: "9 Studio tabs · 8 confirmation-aware MCP tools",
    features: [
      "Real-time system data in TUI, JSON, and MCP interfaces",
      "Nine tabbed Studio views with historical sparklines",
      "Four read-only and four confirmation-gated MCP mutations",
      "Safe process control with protected system processes",
    ],
  },
  {
    name: "audeck",
    description: "TUI audio device manager for macOS (docs coming soon)",
    longDescription:
      "Terminal UI for managing macOS audio devices built with Bubble Tea and CoreAudio. Switch defaults, adjust volume, toggle mute — all from your terminal. Real-time event-driven updates, hot-plug support, per-channel volume fallback for USB interfaces, and Catppuccin Mocha theme.",
    category: "cli",
    tech: ["Go", "Bubble Tea", "CoreAudio"],
    github: "https://github.com/abdul-hamid-achik/audeck",
    featured: false,
    features: [
      "Output and input device switching from the terminal",
      "Real-time event-driven updates via CoreAudio listeners",
      "Hot-plug support for devices appearing and disappearing",
      "Per-channel volume fallback for USB audio interfaces",
    ],
  },
  {
    name: "manuscrypt",
    description:
      "AI-powered book writing platform for literary fiction (docs coming soon)",
    longDescription:
      "AI-powered book writing platform built with Nuxt 3. Context-aware writing assistant powered by Claude API with two model tiers, collaborative character and world-building tools, TipTap rich text editor, manuscript management with export, AI streaming via H3 EventStream, Drizzle ORM with SQLite, and Zod validation.",
    category: "product",
    tech: ["Nuxt 3", "Vue 3", "Claude AI", "Drizzle ORM", "SQLite"],
    github: "https://github.com/abdul-hamid-achik/manuscrypt",
    featured: true,
    features: [
      "Context-aware AI writing assistant with streaming (Haiku + Sonnet tiers)",
      "Collaborative character and world-building tools",
      "TipTap rich text editor with manuscript management",
      "Export capabilities and localStorage draft recovery",
    ],
  },
  {
    name: "dahdit",
    description: "Duolingo-style Morse code learning app (docs coming soon)",
    longDescription:
      "Morse code learning app with a native iOS app in Swift 6 and SwiftUI, a Bun/Hono/GraphQL API backend, and a Nuxt companion web app. Shared domain logic in TypeScript and Swift packages kept in parity. Features SRS, gamification with XP/streaks/hearts/unlocks, 15+ achievements, challenge modes, curated learning paths, Core Haptics, and CoreAudio Morse playback.",
    category: "product",
    tech: ["Swift 6", "SwiftUI", "Nuxt", "GraphQL", "Bun", "PostgreSQL"],
    github: "https://github.com/abdul-hamid-achik/dahdit",
    featured: true,
    features: [
      "Native iOS app in Swift 6 with SwiftUI and SwiftData",
      "GraphQL API with Bun, Hono, Pothos, and Drizzle",
      "SRS, gamification with XP/streaks/hearts/unlocks, 15+ achievements",
      "Core Haptics and CoreAudio Morse playback",
    ],
  },
];
