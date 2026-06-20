"use client"

import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/projects"
import {
  ArrowUpRight,
  Github,
  Layers,
  Library,
  Package,
  Puzzle,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react"

type Category = Project["category"]

/**
 * Per-category visual identity. Every class string is a full literal so the
 * Tailwind scanner can pick it up — the `cat-*` colors are theme-tuned in
 * globals.css for AA contrast in both Polar Night and the white light theme.
 */
const categoryConfig: Record<
  Category,
  {
    label: string
    Icon: LucideIcon
    text: string
    chip: string
    dot: string
    accent: string
    hoverBorder: string
  }
> = {
  product: {
    label: "Product",
    Icon: Package,
    text: "text-cat-product",
    chip: "bg-cat-product/10",
    dot: "bg-cat-product",
    accent: "border-l-cat-product",
    hoverBorder: "hover:border-cat-product/50",
  },
  cli: {
    label: "CLI",
    Icon: Terminal,
    text: "text-cat-cli",
    chip: "bg-cat-cli/10",
    dot: "bg-cat-cli",
    accent: "border-l-cat-cli",
    hoverBorder: "hover:border-cat-cli/50",
  },
  library: {
    label: "Library",
    Icon: Library,
    text: "text-cat-library",
    chip: "bg-cat-library/10",
    dot: "bg-cat-library",
    accent: "border-l-cat-library",
    hoverBorder: "hover:border-cat-library/50",
  },
  "neovim-plugin": {
    label: "Neovim",
    Icon: Puzzle,
    text: "text-cat-neovim",
    chip: "bg-cat-neovim/10",
    dot: "bg-cat-neovim",
    accent: "border-l-cat-neovim",
    hoverBorder: "hover:border-cat-neovim/50",
  },
}

const FILTERS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "product", label: "Products" },
  { key: "cli", label: "CLI" },
  { key: "library", label: "Libraries" },
  { key: "neovim-plugin", label: "Neovim" },
]

function CategoryBadge({ category }: { category: Category }) {
  const c = categoryConfig[category]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-foreground/80",
        c.chip
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  )
}

function TechBadge({ tech }: { tech: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {tech}
    </span>
  )
}

function FeaturedCard({ project }: { project: Project }) {
  const c = categoryConfig[project.category]
  const Icon = c.Icon
  return (
    <Card
      className={cn(
        "group flex flex-col border-l-[3px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        c.accent,
        c.hoverBorder
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              c.chip,
              c.text
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg leading-tight">
                {project.name}
              </CardTitle>
              <CategoryBadge category={project.category} />
            </div>
            <CardDescription className="mt-1">
              {project.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {project.longDescription}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <TechBadge key={t} tech={t} />
          ))}
        </div>
        <ul className="space-y-1.5 text-sm">
          {project.features.map((feature) => (
            <li key={feature} className="flex gap-2.5">
              <span
                className={cn(
                  "mt-[7px] h-1 w-1 shrink-0 rounded-full",
                  c.dot
                )}
              />
              <span className="text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="gap-2">
        {project.website && (
          <Button variant="outline" size="sm" asChild>
            <a href={project.website} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              {project.website.replace("https://", "")}
            </a>
          </Button>
        )}
        {project.github && (
          <Button variant="ghost" size="sm" asChild>
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              <Github className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function CompactCard({ project }: { project: Project }) {
  const c = categoryConfig[project.category]
  const Icon = c.Icon
  const extraTech = project.tech.length - 3
  return (
    <Card
      className={cn(
        "group flex h-full flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        c.hoverBorder
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            c.chip,
            c.text
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{project.name}</h3>
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)}
              title={c.label}
            />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {project.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {project.tech.slice(0, 3).map((t) => (
          <TechBadge key={t} tech={t} />
        ))}
        {extraTech > 0 && (
          <span className="inline-flex items-center px-1 text-[11px] font-medium text-muted-foreground/70">
            +{extraTech}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-3 pt-1 text-xs font-medium">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        )}
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {project.website.replace("https://", "")}
          </a>
        )}
      </div>
    </Card>
  )
}

function SectionHeading({
  Icon,
  title,
  count,
}: {
  Icon: LucideIcon
  title: string
  count: number
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </div>
  )
}

export function ProjectsView({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<"all" | Category>("all")

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: projects.length }
    for (const p of projects) base[p.category] = (base[p.category] ?? 0) + 1
    return base
  }, [projects])

  const visibleFilters = FILTERS.filter(
    (f) => f.key === "all" || (counts[f.key] ?? 0) > 0
  )

  const matches = (p: Project) => active === "all" || p.category === active
  const featured = projects.filter((p) => p.featured && matches(p))
  const more = projects.filter((p) => !p.featured && matches(p))

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {visibleFilters.map((f) => {
          const isActive = active === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground/60"
                )}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      <div key={active} className="space-y-12 animate-in fade-in-50 duration-300">
        {featured.length > 0 && (
          <section>
            <SectionHeading
              Icon={Sparkles}
              title="Featured"
              count={featured.length}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((project) => (
                <FeaturedCard key={project.name} project={project} />
              ))}
            </div>
          </section>
        )}

        {more.length > 0 && (
          <section>
            <SectionHeading
              Icon={Layers}
              title="More Projects"
              count={more.length}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((project) => (
                <CompactCard key={project.name} project={project} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
