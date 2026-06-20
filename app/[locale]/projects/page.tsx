import { ProjectsView } from "@/components/projects-view"
import { projects } from "@/lib/projects"
import { locales } from "@/navigation"
import { Metadata } from "next"
import { unstable_setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Products and open-source tools by Abdul Hamid Achik — browser extensions, CLI tools, Neovim plugins, and Go libraries.",
  keywords:
    "Abdul Hamid Achik, projects, open source, CLI tools, Neovim plugins, Go libraries, browser extensions, developer tools, LinkGlow, hitspec, Tarot Agent, Vue Native, Blueprint",
  openGraph: {
    title: "Projects | Abdul Hamid",
    description:
      "Products and open-source tools by Abdul Hamid Achik — browser extensions, CLI tools, Neovim plugins, and Go libraries.",
    type: "website",
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
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

  return (
    <div className="breakout-wide py-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Projects
        </h1>
        <p className="mt-2 text-muted-foreground">
          Products I&apos;m building and open-source tools I maintain.
        </p>
      </div>

      <ProjectsView projects={projects} />
    </div>
  )
}
