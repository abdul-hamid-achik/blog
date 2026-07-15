// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsView } from "../../components/projects-view";
import type { Project } from "../../lib/projects";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, number>) => {
    const labels: Record<string, string> = {
      directoryTitle: "Project directory",
      empty: "No projects found",
      filterLabel: "Filter projects",
      reset: "Reset filters",
      searchLabel: "Search projects",
      searchPlaceholder: "Search the catalog",
      selectedDescription: "Current work",
      selectedKicker: "Selected",
      selectedTitle: "Selected work",
      source: "Source",
    };

    if (key === "shown") return `${values?.count ?? 0} shown`;
    if (key.startsWith("categories.")) return key.slice("categories.".length);
    if (key.startsWith("filters.")) return key.slice("filters.".length);
    return labels[key] ?? key;
  },
}));

function project({
  name,
  category,
  ...overrides
}: Partial<Project> & Pick<Project, "name" | "category">): Project {
  return {
    name,
    category,
    description: `${name} short description`,
    longDescription: `${name} long description`,
    tech: ["TypeScript"],
    featured: false,
    features: [`${name} feature`],
    ...overrides,
  };
}

const projects: Project[] = [
  project({
    name: "cortex",
    category: "cli",
    description: "Evidence-guided agent kernel",
    tech: ["Go", "MCP"],
  }),
  project({
    name: "glyphrun",
    category: "cli",
    description: "Terminal workflow runner",
    tech: ["Rust", "Terminal"],
  }),
  project({
    name: "Tiny Vault",
    category: "product",
    description: "Local secrets product",
    features: ["Offline vault recovery"],
  }),
  project({
    name: "noted.nvim",
    category: "neovim-plugin",
    description: "Notes inside Neovim",
    tech: ["Lua"],
  }),
];

function getProjectDetails(name: string) {
  const id = `project-${name
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

  return document.getElementById(id) as HTMLDetailsElement | null;
}

describe("ProjectsView", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/projects");
  });

  it("treats a whitespace-only search as empty", async () => {
    const user = userEvent.setup();
    render(<ProjectsView projects={projects} />);

    await user.type(screen.getByRole("searchbox"), "   ");

    expect(
      screen.getByRole("heading", { name: "Selected work" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4 shown")).toBeInTheDocument();
    expect(getProjectDetails("cortex")).toBeInTheDocument();
    expect(getProjectDetails("Tiny Vault")).toBeInTheDocument();
  });

  it("ignores a malformed percent-encoded project hash", () => {
    window.history.replaceState({}, "", "/projects#project-%E0%A4%A");

    expect(() => render(<ProjectsView projects={projects} />)).not.toThrow();
    expect(document.querySelector("details[open]")).not.toBeInTheDocument();
  });

  it("opens and focuses a deeply linked project", () => {
    window.history.replaceState({}, "", "/projects#project-cortex");
    render(<ProjectsView projects={projects} />);

    const target = getProjectDetails("cortex");
    const summary = target?.querySelector("summary");

    expect(target).toHaveAttribute("open");
    expect(summary).toHaveFocus();
  });

  it("combines category and text filters", async () => {
    const user = userEvent.setup();
    render(<ProjectsView projects={projects} />);

    await user.click(screen.getByRole("button", { name: /cli 2/i }));

    expect(getProjectDetails("cortex")).toBeInTheDocument();
    expect(getProjectDetails("glyphrun")).toBeInTheDocument();
    expect(getProjectDetails("Tiny Vault")).not.toBeInTheDocument();
    expect(screen.getByText("2 shown")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "terminal");

    expect(getProjectDetails("cortex")).not.toBeInTheDocument();
    expect(getProjectDetails("glyphrun")).toBeInTheDocument();
    expect(screen.getByText("1 shown")).toBeInTheDocument();
  });

  it("resets both filters from the no-results state", async () => {
    const user = userEvent.setup();
    render(<ProjectsView projects={projects} />);

    await user.click(screen.getByRole("button", { name: /product 1/i }));
    await user.type(screen.getByRole("searchbox"), "does-not-exist");

    expect(screen.getByText("No projects found")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("button", { name: /all 4/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("4 shown")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Selected work" }),
    ).toBeInTheDocument();
    expect(getProjectDetails("cortex")).toBeInTheDocument();
    expect(getProjectDetails("Tiny Vault")).toBeInTheDocument();
  });
});
