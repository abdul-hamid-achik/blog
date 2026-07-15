import { ProjectsView } from "@/components/projects-view";
import { localizeProjects } from "@/lib/project-translations";
import { projects } from "@/lib/projects";
import { getLocalizedUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ProjectsPageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ProjectsPage" });
  const baseUrl = getBaseURL();
  const canonicalUrl = getLocalizedUrl(locale, "/projects", baseUrl);
  const languages = Object.fromEntries(
    locales.map((candidate) => [
      candidate,
      getLocalizedUrl(candidate, "/projects", baseUrl),
    ]),
  );

  return {
    metadataBase: new URL(baseUrl),
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    keywords: t("metadataKeywords"),
    openGraph: {
      title: `${t("metadataTitle")} | Abdul Hamid`,
      description: t("metadataDescription"),
      type: "website",
      url: canonicalUrl,
    },
    alternates: { canonical: canonicalUrl, languages },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  const isValidLocale = locales.some((cur) => cur === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "ProjectsPage" });
  const localizedProjects = localizeProjects(projects, locale);

  const mcpProjects = localizedProjects.filter((project) =>
    project.tech.includes("MCP"),
  ).length;
  const liveProjects = localizedProjects.filter(
    (project) => project.website,
  ).length;
  const categories = new Set(
    localizedProjects.map((project) => project.category),
  ).size;

  return (
    <div className="site-shell border-x border-border px-5 pb-24 sm:px-8 lg:px-12">
      <header className="grid gap-12 border-b border-border py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-24">
        <div>
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="display-title mt-7 max-w-5xl text-balance">
            {t("title")}
          </h1>
        </div>

        <div className="lg:border-l lg:border-border lg:pl-6">
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
          <a
            href="https://github.com/abdul-hamid-achik"
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-block border-b border-primary pb-1 text-sm font-semibold text-primary"
          >
            {t("browseRepositories")} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <dl className="grid grid-cols-2 border-b border-border md:grid-cols-4">
        {[
          [t("stats.projects"), localizedProjects.length],
          [t("stats.mcp"), mcpProjects],
          [t("stats.sites"), liveProjects],
          [t("stats.types"), categories],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`py-6 ${index % 2 === 1 ? "border-l" : ""} ${index > 1 ? "border-t md:border-t-0" : ""} md:border-l md:first:border-l-0 md:px-6`}
          >
            <dt className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="pt-16 lg:pt-24">
        <ProjectsView projects={localizedProjects} />
      </div>
    </div>
  );
}
