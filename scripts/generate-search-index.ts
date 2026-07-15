import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { allPages, allPaintings, allPosts } from "content-collections";
import { localizeProjects } from "../lib/project-translations";
import { getProjectAnchor, projects } from "../lib/projects";
import type { SearchDocument } from "../lib/search";

const locales = ["en", "es", "ru"] as const;
const outputDirectory = join(process.cwd(), "public", "search");

function documentsForLocale(
  locale: (typeof locales)[number],
): SearchDocument[] {
  const posts: SearchDocument[] = allPosts
    .filter((post) => post.locale === locale && post.public)
    .map((post) => ({
      id: post._meta.path,
      title: post.title,
      description: post.description,
      href: `/posts/${post.slugAsParams}`,
      kind: "Writing",
    }));

  const pages: SearchDocument[] = allPages
    .filter((page) => page.locale === locale && page.slugAsParams !== "blocked")
    .map((page) => ({
      id: page._meta.path,
      title: page.title,
      description: page.description,
      href: `/${page.slugAsParams}`,
      kind: "Page",
    }));

  const paintings: SearchDocument[] = allPaintings
    .filter((painting) => painting.locale === locale)
    .map((painting) => ({
      id: painting._meta.path,
      title: painting.title,
      description: painting.description,
      href: `/paintings/${painting.slugAsParams}`,
      kind: "Painting",
    }));

  const projectDocuments: SearchDocument[] = localizeProjects(
    projects,
    locale,
  ).map((project) => ({
    id: `project:${project.name}`,
    title: project.name,
    description: project.description,
    href: `/projects#${getProjectAnchor(project.name)}`,
    kind: "Project",
  }));

  return [...projectDocuments, ...posts, ...pages, ...paintings];
}

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  locales.map((locale) =>
    writeFile(
      join(outputDirectory, `${locale}.json`),
      `${JSON.stringify(documentsForLocale(locale), null, 2)}\n`,
      "utf8",
    ),
  ),
);

console.log(`Generated search indexes for ${locales.join(", ")}`);
