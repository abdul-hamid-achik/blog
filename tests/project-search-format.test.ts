import { describe, expect, it } from "vitest";

import {
  findProjects,
  formatCurrentProjectContext,
  formatProjectSearchResults,
  getCurrentProjects,
  isCurrentProjectQuery,
} from "../lib/project-search";
import type { Project } from "../lib/projects";
import { Locale } from "../lib/types";

const minimalProject: Project = {
  name: "Minimal Tool",
  description: "A deliberately small project",
  longDescription: "A project fixture without optional metadata.",
  category: "cli",
  tech: ["Go"],
  featured: false,
  features: ["One focused capability"],
};

const completeProject: Project = {
  ...minimalProject,
  name: "Complete Tool",
  stage: "Shipping",
  website: "https://complete.example",
  github: "https://github.com/example/complete",
};

describe("project result formatting", () => {
  it.each([
    [Locale.EN, "No matching project was found"],
    [Locale.ES, "No se encontró un proyecto"],
    [Locale.RU, "подходящий проект не найден"],
  ])("localizes the empty result for %s", (locale, expectedCopy) => {
    expect(formatProjectSearchResults([], locale)).toContain(expectedCopy);
  });

  it("formats complete English metadata and an unprefixed navigation token", () => {
    const result = formatProjectSearchResults([completeProject], Locale.EN);

    expect(result).toContain("## Complete Tool");
    expect(result).toContain("Description: A deliberately small project");
    expect(result).toContain("Details: A project fixture");
    expect(result).toContain("Stage: Shipping");
    expect(result).toContain("Technologies: Go");
    expect(result).toContain("Highlights: One focused capability");
    expect(result).toContain("Live site: https://complete.example");
    expect(result).toContain(
      "Source code: https://github.com/example/complete",
    );
    expect(result).toContain("[NAVIGATE:/projects#project-complete-tool]");
  });

  it("omits absent optional metadata and localizes the remaining labels", () => {
    const result = formatProjectSearchResults([minimalProject], Locale.RU);

    expect(result).toContain("Описание: A deliberately small project");
    expect(result).toContain("Технологии: Go");
    expect(result).toContain("[NAVIGATE:/ru/projects#project-minimal-tool]");
    expect(result).not.toContain("Этап:");
    expect(result).not.toContain("Работающий сайт:");
    expect(result).not.toContain("Исходный код:");
  });

  it("separates multiple results exactly once", () => {
    const result = formatProjectSearchResults(
      [minimalProject, completeProject],
      Locale.ES,
    );

    expect(result.match(/\n\n---\n\n/g)).toHaveLength(1);
    expect(result).toContain("[NAVIGATE:/es/projects#project-minimal-tool]");
    expect(result).toContain("[NAVIGATE:/es/projects#project-complete-tool]");
  });
});

describe("current project context", () => {
  it.each([
    [Locale.EN, "/projects#project-cortex"],
    [Locale.ES, "/es/projects#project-cortex"],
    [Locale.RU, "/ru/projects#project-cortex"],
  ])("uses localized navigation and catalog copy for %s", (locale, path) => {
    const [localizedCortex] = getCurrentProjects(locale, 1);
    const result = formatCurrentProjectContext(locale, 1);

    expect(result).toContain(`- **cortex** — ${localizedCortex.description}`);
    expect(result).toContain("v0.12.0");
    expect(result).toContain("https://cortexai.tools");
    expect(result).toContain("https://github.com/abdul-hamid-achik/cortex");
    expect(result).toContain(`[NAVIGATE:${path}]`);
    expect(result.split("\n")).toHaveLength(1);
  });

  it("preserves the curated order and requested result count", () => {
    const lines = formatCurrentProjectContext(Locale.EN, 3).split("\n");

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("**cortex**");
    expect(lines[1]).toContain("**bob**");
    expect(lines[2]).toContain("**mcphub**");
  });
});

describe("project search boundaries", () => {
  it("normalizes accents and punctuation for explicit project matches", () => {
    expect(findProjects("¿Qué hace CÓRTEX?", Locale.ES, 10)).toHaveLength(1);
    expect(findProjects("¿Qué hace CÓRTEX?", Locale.ES, 10)[0]?.name).toBe(
      "cortex",
    );
  });

  it("does not mistake ordinary historical queries for current-work intent", () => {
    expect(isCurrentProjectQuery("Show me the project archive history")).toBe(
      false,
    );
  });

  it("clamps zero and negative limits to one", () => {
    expect(getCurrentProjects(Locale.EN, 0).map(({ name }) => name)).toEqual([
      "cortex",
    ]);
    expect(getCurrentProjects(Locale.EN, -20).map(({ name }) => name)).toEqual([
      "cortex",
    ]);
  });

  it("truncates fractional limits and caps large finite limits", () => {
    expect(getCurrentProjects(Locale.EN, 2.9)).toHaveLength(2);
    expect(getCurrentProjects(Locale.EN, 100)).toHaveLength(10);
  });

  it("falls back to five results for non-finite limits", () => {
    expect(getCurrentProjects(Locale.EN, Number.NaN)).toHaveLength(5);
    expect(
      getCurrentProjects(Locale.EN, Number.POSITIVE_INFINITY),
    ).toHaveLength(5);
  });
});
