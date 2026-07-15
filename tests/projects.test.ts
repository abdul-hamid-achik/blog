import { describe, expect, it } from "vitest";

import {
  localizeProjects,
  projectTranslations,
} from "../lib/project-translations";
import {
  findProjects,
  getCurrentProjects,
  isCurrentProjectQuery,
} from "../lib/project-search";
import { getProjectAnchor, projects } from "../lib/projects";

const recentlyAddedProjects = [
  "cortex",
  "bob",
  "mcphub",
  "monitor",
  "cairntrace",
  "file.cheap",
  "tinyvault",
  "local-agent",
  "glyphrun",
  "Blueprint",
];

const requestedLiveSites = {
  Blueprint: "https://blueprint-lang.dev",
  "file.cheap": "https://file.cheap",
  hitspec: "https://hitspec.dev",
  "local-agent": "https://local-agent.dev",
  monitor: "https://monitorcli.dev",
  tinyvault: "https://tinyvault.dev",
};

describe("project catalog", () => {
  it("contains every named project exactly once", () => {
    const names = projects.map(({ name }) => name);

    expect(projects).toHaveLength(33);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining(recentlyAddedProjects));
  });

  it("generates stable, unique anchors for every project", () => {
    const anchors = projects.map(({ name }) => getProjectAnchor(name));

    expect(new Set(anchors).size).toBe(projects.length);
    expect(getProjectAnchor("Vue Native")).toBe("project-vue-native");
    expect(getProjectAnchor("file.cheap")).toBe("project-file-cheap");
    expect(getProjectAnchor("ClipIt.now")).toBe("project-clipit-now");
    expect(getProjectAnchor("noted.nvim")).toBe("project-noted-nvim");
  });

  it("keeps all published repository and website links secure and valid", () => {
    for (const project of projects) {
      const links = [project.github, project.website].filter(
        (value): value is string => Boolean(value),
      );

      for (const value of links) {
        const url = new URL(value);

        expect(url.protocol, `${project.name}: ${value}`).toBe("https:");
        expect(url.hostname, `${project.name}: ${value}`).not.toBe("");
      }
    }
  });

  it("exposes the complete live-site directory and requested deployments", () => {
    const liveSites = new Map(
      projects
        .filter((project): project is typeof project & { website: string } =>
          Boolean(project.website),
        )
        .map((project) => [project.name, project.website]),
    );

    expect(liveSites.size).toBe(20);
    expect(Object.fromEntries(liveSites)).toMatchObject(requestedLiveSites);
  });
});

describe("project localization", () => {
  it.each(["es", "ru"] as const)(
    "has complete %s descriptions for the catalog",
    (locale) => {
      expect(Object.keys(projectTranslations[locale]).sort()).toEqual(
        projects.map(({ name }) => name).sort(),
      );

      const localized = localizeProjects(projects, locale);

      expect(localized).toHaveLength(projects.length);
      localized.forEach((project, index) => {
        const source = projects[index];

        expect(project.name).toBe(source.name);
        expect(project.description).not.toBe(source.description);
        expect(project.longDescription).not.toBe(source.longDescription);
        expect(project.features).not.toBe(source.features);
        expect(project.tech).toBe(source.tech);
        expect(project.github).toBe(source.github);
        expect(project.website).toBe(source.website);
      });
    },
  );

  it("normalizes regional locale tags", () => {
    expect(localizeProjects(projects, "es-MX")).toEqual(
      localizeProjects(projects, "es"),
    );
    expect(localizeProjects(projects, "ru_RU")).toEqual(
      localizeProjects(projects, "ru"),
    );
  });

  it("returns the original catalog for English and unsupported locales", () => {
    expect(localizeProjects(projects, "en")).toBe(projects);
    expect(localizeProjects(projects, "fr")).toBe(projects);
  });
});

describe("project concierge search", () => {
  it("prioritizes an explicitly named project in natural-language questions", () => {
    const [project] = findProjects(
      "¿Qué es cortex? Responde brevemente.",
      "es",
      3,
    );

    expect(project?.name).toBe("cortex");
    expect(
      findProjects("¿Qué es cortex? Responde brevemente.", "es", 3),
    ).toHaveLength(1);
    expect(project?.description).toBe(
      projectTranslations.es.cortex.description,
    );
  });

  it("matches spaced names, domains, and the newly linked live projects", () => {
    expect(findProjects("tiny vault secrets", "en", 1)[0]?.name).toBe(
      "tinyvault",
    );
    expect(findProjects("monitorcli.dev", "en", 1)[0]?.name).toBe("monitor");
    expect(findProjects("hitspec.dev API tests", "en", 1)[0]?.name).toBe(
      "hitspec",
    );
    expect(findProjects("blueprint-lang.dev", "en", 1)[0]?.name).toBe(
      "Blueprint",
    );
  });

  it.each([
    ["What are you building right now?", "en"],
    ["¿Qué estás construyendo ahora?", "es"],
    ["Какие проекты сейчас в работе?", "ru"],
    ["Проекты в активной разработке", "ru"],
    ["¿En qué proyectos trabajas actualmente?", "es"],
  ])("returns the curated current-work sequence for %s", (query, locale) => {
    expect(isCurrentProjectQuery(query)).toBe(true);
    expect(findProjects(query, locale, 5).map(({ name }) => name)).toEqual([
      "cortex",
      "bob",
      "mcphub",
      "cairntrace",
      "glyphrun",
    ]);
  });

  it("exposes the curated sequence without relying on query wording", () => {
    expect(getCurrentProjects("ru", 3).map(({ name }) => name)).toEqual([
      "cortex",
      "bob",
      "mcphub",
    ]);
  });

  it("clamps result limits and returns no arbitrary catalog entries", () => {
    expect(findProjects("", "en", 50)).toEqual([]);
    expect(findProjects("Go", "en", 50).length).toBeLessThanOrEqual(10);
  });
});
