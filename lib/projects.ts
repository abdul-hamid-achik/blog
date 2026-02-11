export interface Project {
  name: string
  description: string
  longDescription: string
  category: "product" | "cli" | "library" | "neovim-plugin"
  tech: string[]
  github?: string
  website?: string
  featured: boolean
  features: string[]
}

export const projects: Project[] = [
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
    description: "Embeddable vector database with HNSW",
    longDescription:
      "Lightweight vector database with HNSW indexing, hybrid search, and 55 MCP tools. Designed to be embedded in other Go applications.",
    category: "library",
    tech: ["Go"],
    github: "https://github.com/abdul-hamid-achik/veclite",
    featured: false,
    features: [
      "HNSW indexing for fast similarity search",
      "Hybrid search (vector + keyword)",
      "55 MCP tools for AI integration",
    ],
  },
  {
    name: "vecgrep",
    description: "Semantic code search with vector embeddings",
    longDescription:
      "Search your codebase semantically using vector embeddings. Built on veclite, works as both a CLI tool and MCP server.",
    category: "cli",
    tech: ["Go", "TypeScript", "MCP"],
    github: "https://github.com/abdul-hamid-achik/vecgrep",
    featured: false,
    features: [
      "Semantic search across entire codebases",
      "Hybrid mode: semantic + keyword",
      "MCP server for AI agent integration",
    ],
  },
  {
    name: "file.cheap",
    description: "Local file processing CLI & MCP server",
    longDescription:
      "Process images, PDFs, and videos locally. Single binary, zero cloud dependencies. 14 MCP tools for AI-assisted file operations.",
    category: "cli",
    tech: ["Go", "MCP"],
    github: "https://github.com/abdul-hamid-achik/file.cheap",
    featured: false,
    features: [
      "Image resize, convert, watermark, optimize",
      "PDF & video thumbnail generation",
      "14 MCP tools, zero cloud dependencies",
    ],
  },
  {
    name: "tinyvault",
    description: "Local secrets management with AES-256-GCM",
    longDescription:
      "Dead-simple local secrets manager with AES-256-GCM encryption, Argon2id key derivation, and an MCP server for AI agent access policies.",
    category: "cli",
    tech: ["Go", "bbolt", "MCP"],
    github: "https://github.com/abdul-hamid-achik/tinyvault",
    featured: false,
    features: [
      "AES-256-GCM + Argon2id encryption",
      "Multi-project with isolated keys",
      "MCP server with access policies",
    ],
  },
]
