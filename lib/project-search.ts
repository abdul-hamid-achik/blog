import { localizeProjects } from "./project-translations";
import {
  flagshipProjectOrder,
  getProjectAnchor,
  projects,
  type Project,
} from "./projects";
import { getLocalizedPath } from "./site-url";
import { Locale } from "./types";

const MAX_RESULTS = 10;

const PROJECT_RESULT_COPY = {
  [Locale.EN]: {
    noResults: "No matching project was found in Abdul Hamid's catalog.",
    description: "Description",
    details: "Details",
    stage: "Stage",
    technologies: "Technologies",
    highlights: "Highlights",
    website: "Live site",
    source: "Source code",
  },
  [Locale.ES]: {
    noResults:
      "No se encontró un proyecto que coincida en el catálogo de Abdul Hamid.",
    description: "Descripción",
    details: "Detalles",
    stage: "Etapa",
    technologies: "Tecnologías",
    highlights: "Aspectos destacados",
    website: "Sitio activo",
    source: "Código fuente",
  },
  [Locale.RU]: {
    noResults: "В каталоге Абдула Хамида подходящий проект не найден.",
    description: "Описание",
    details: "Подробнее",
    stage: "Этап",
    technologies: "Технологии",
    highlights: "Ключевые возможности",
    website: "Работающий сайт",
    source: "Исходный код",
  },
} satisfies Record<
  Locale,
  {
    noResults: string;
    description: string;
    details: string;
    stage: string;
    technologies: string;
    highlights: string;
    website: string;
    source: string;
  }
>;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("en")
    .replace(/[áàäâãå]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöôõ]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\p{L}]+/gu, " ")
    .trim();
}

export function isCurrentProjectQuery(query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  const patterns = [
    /\bwhat (?:are you building|are you working on|projects? are active)\b/,
    /\b(?:current|active|recent) projects?\b/,
    /\bprojects?.*(?:current|active|working|building|shipping|right now)\b/,
    /\bque (?:estas construyendo|proyectos? estan? activos?)\b/,
    /\b(?:proyectos? actuales?|proyectos? en curso|en que estas trabajando)\b/,
    /proyectos?.*(?:actual|activ|curso|trabaj|constru|desarroll)/,
    /проекты?.*(?:сейчас|работ|разработ|актив|текущ|нов)/,
    /(?:сейчас|текущ|актив|нов).*проекты?/,
    /над чем (?:ты |вы )?(?:работаешь|работаете)/,
    /что (?:ты |вы )?(?:сейчас )?(?:строишь|строите|разрабатываешь|разрабатываете)/,
  ];

  return patterns.some((pattern) => pattern.test(normalizedQuery));
}

function getSearchScore(project: Project, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const normalizedName = normalizeSearchText(project.name);
  const compactQuery = normalizedQuery.replaceAll(" ", "");
  const compactName = normalizedName.replaceAll(" ", "");
  const searchableText = normalizeSearchText(
    [
      project.name,
      project.description,
      project.longDescription,
      project.tech.join(" "),
      project.features.join(" "),
      project.website,
      project.github,
      project.stage,
      project.proof,
    ]
      .filter(Boolean)
      .join(" "),
  );

  let score = project.featured ? 1 : 0;

  if (normalizedQuery === normalizedName || compactQuery === compactName) {
    score += 1_000;
  } else if (
    normalizedQuery.includes(normalizedName) ||
    compactQuery.includes(compactName)
  ) {
    score += 750;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 500;
  }

  for (const term of new Set(normalizedQuery.split(" "))) {
    if (term.length < 2) continue;
    if (normalizedName.split(" ").includes(term)) score += 90;
    if (normalizedName.includes(term)) score += 35;
    if (searchableText.includes(term)) score += 8;
  }

  return score;
}

function findExplicitProject(
  localizedProjects: Project[],
  query: string,
): Project | undefined {
  const normalizedQuery = normalizeSearchText(query);
  const queryTerms = new Set(normalizedQuery.split(" "));
  const compactQuery = normalizedQuery.replaceAll(" ", "");

  return localizedProjects
    .filter((project) => {
      const normalizedName = normalizeSearchText(project.name);
      const compactName = normalizedName.replaceAll(" ", "");

      return normalizedName.includes(" ")
        ? normalizedQuery.includes(normalizedName) ||
            compactQuery.includes(compactName)
        : queryTerms.has(normalizedName) ||
            (compactName.length >= 5 && compactQuery.includes(compactName));
    })
    .sort(
      (first, second) =>
        normalizeSearchText(second.name).length -
        normalizeSearchText(first.name).length,
    )[0];
}

export function findProjects(
  query: string,
  locale: Locale | string,
  limit = 5,
): Project[] {
  const normalizedLimit = Math.min(
    MAX_RESULTS,
    Math.max(1, Math.trunc(Number.isFinite(limit) ? limit : 5)),
  );

  const localizedProjects = localizeProjects(projects, locale);

  if (isCurrentProjectQuery(query)) {
    return getCurrentProjects(locale, normalizedLimit);
  }

  const explicitProject = findExplicitProject(localizedProjects, query);
  if (explicitProject) return [explicitProject];

  return localizedProjects
    .map((project, index) => ({
      project,
      index,
      score: getSearchScore(project, query),
    }))
    .filter(({ score }) => score > 1)
    .sort(
      (first, second) =>
        second.score - first.score ||
        Number(second.project.featured) - Number(first.project.featured) ||
        first.index - second.index,
    )
    .slice(0, normalizedLimit)
    .map(({ project }) => project);
}

export function getCurrentProjects(
  locale: Locale | string,
  limit = 5,
): Project[] {
  const normalizedLimit = Math.min(
    MAX_RESULTS,
    Math.max(1, Math.trunc(Number.isFinite(limit) ? limit : 5)),
  );
  const localizedProjects = localizeProjects(projects, locale);

  return flagshipProjectOrder
    .map((name) => localizedProjects.find((project) => project.name === name))
    .filter((project): project is Project => Boolean(project))
    .slice(0, normalizedLimit);
}

export function formatCurrentProjectContext(locale: Locale, limit = 5): string {
  return getCurrentProjects(locale, limit)
    .map((project) => {
      const links = [project.website, project.github]
        .filter(Boolean)
        .join(" · ");
      return `- **${project.name}** — ${project.description}${project.stage ? ` · ${project.stage}` : ""}${links ? ` · ${links}` : ""} [NAVIGATE:${getLocalizedPath(locale, `/projects#${getProjectAnchor(project.name)}`)}]`;
    })
    .join("\n");
}

export function formatProjectSearchResults(
  results: Project[],
  locale: Locale,
): string {
  const copy = PROJECT_RESULT_COPY[locale];
  if (results.length === 0) return copy.noResults;

  return results
    .map((project) => {
      const lines = [
        `## ${project.name}`,
        `${copy.description}: ${project.description}`,
        `${copy.details}: ${project.longDescription}`,
        project.stage ? `${copy.stage}: ${project.stage}` : null,
        `${copy.technologies}: ${project.tech.join(", ")}`,
        `${copy.highlights}: ${project.features.join("; ")}`,
        project.website ? `${copy.website}: ${project.website}` : null,
        project.github ? `${copy.source}: ${project.github}` : null,
        `[NAVIGATE:${getLocalizedPath(locale, `/projects#${getProjectAnchor(project.name)}`)}]`,
      ];

      return lines
        .filter((line): line is string => typeof line === "string")
        .join("\n");
    })
    .join("\n\n---\n\n");
}
