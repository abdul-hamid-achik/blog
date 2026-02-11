import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { projects, type Project } from "@/lib/projects"
import { locales } from "@/navigation"
import { ExternalLink, Github } from "lucide-react"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Products and open-source tools by Abdul Hamid Achik — browser extensions, CLI tools, Neovim plugins, and Go libraries.",
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const categoryLabels: Record<Project["category"], string> = {
  product: "Product",
  cli: "CLI",
  library: "Library",
  "neovim-plugin": "Nvim Plugin",
}

function TechBadge({ tech }: { tech: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {tech}
    </span>
  )
}

function CategoryBadge({ category }: { category: Project["category"] }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {categoryLabels[category]}
    </span>
  )
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{project.name}</CardTitle>
            <CardDescription className="mt-1">
              {project.description}
            </CardDescription>
          </div>
          <CategoryBadge category={project.category} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">
          {project.longDescription}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <TechBadge key={t} tech={t} />
          ))}
        </div>
        <ul className="space-y-1 text-sm">
          {project.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span className="text-muted-foreground select-none">-</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="gap-2">
        {project.website && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {project.website.replace("https://", "")}
            </a>
          </Button>
        )}
        {project.github && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-1.5 h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="flex flex-row items-center gap-0 p-4 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0">
      <div className="flex-1 min-w-0 sm:flex sm:flex-col sm:flex-1">
        <CardHeader className="p-0 pb-2 sm:p-6 sm:pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base truncate">{project.name}</CardTitle>
            <CategoryBadge category={project.category} />
          </div>
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0 sm:flex-1">
          <div className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <TechBadge key={t} tech={t} />
            ))}
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-0 pl-4 sm:p-4 sm:pt-0 sm:pl-6">
        {project.github && (
          <Button variant="ghost" size="sm" asChild>
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-1.5 h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">GitHub</span>
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isValidLocale = locales.some((cur) => cur === locale)

  if (!isValidLocale) notFound()

  unstable_setRequestLocale(locale)

  const featured = projects.filter((p) => p.featured)
  const oss = projects.filter((p) => !p.featured)

  return (
    <div className="py-6">
      <div className="prose dark:prose-invert mb-8">
        <h1>Projects</h1>
        <p>Products I&apos;m building and open-source tools I maintain.</p>
      </div>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Products</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {featured.map((project) => (
            <FeaturedCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Open Source</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oss.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}
