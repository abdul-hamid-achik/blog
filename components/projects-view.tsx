"use client";

import { cn } from "@/lib/utils";
import { getProjectAnchor, type Project } from "@/lib/projects";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type Category = Project["category"];
type Filter = "all" | Category;

const filters: Filter[] = ["all", "cli", "product", "library", "neovim-plugin"];

const selectedOrder = ["cortex", "bob", "mcphub", "cairntrace", "glyphrun"];
const selectedLayouts = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-12",
];

function ProjectLinks({
  project,
  inverse = false,
}: {
  project: Project;
  inverse?: boolean;
}) {
  const t = useTranslations("ProjectsPage");

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
      {project.website && (
        <a
          href={project.website}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "border-b pb-0.5 transition-colors",
            inverse
              ? "border-inverse-accent text-inverse-accent hover:border-background hover:text-background focus-visible:outline-inverse-accent dark:border-primary dark:text-primary dark:hover:border-foreground dark:hover:text-foreground dark:focus-visible:outline-primary"
              : "border-primary text-primary hover:border-foreground hover:text-foreground focus-visible:outline-primary",
          )}
        >
          {project.website.replace("https://", "")}{" "}
          <span aria-hidden="true">↗</span>
        </a>
      )}
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "border-b pb-0.5 transition-colors",
            inverse
              ? "border-background/25 text-background/70 hover:border-background hover:text-background focus-visible:outline-inverse-accent dark:border-border dark:text-muted-foreground dark:hover:border-foreground dark:hover:text-foreground dark:focus-visible:outline-primary"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-primary",
          )}
        >
          {t("source")} <span aria-hidden="true">↗</span>
        </a>
      )}
    </div>
  );
}

function SelectedProject({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const t = useTranslations("ProjectsPage");

  return (
    <article
      data-featured-project={index === 0 ? "true" : undefined}
      data-project-card={getProjectAnchor(project.name)}
      className={cn(
        "group flex min-h-80 flex-col border border-border bg-card p-6 transition-colors sm:p-8",
        selectedLayouts[index],
        index === 0
          ? "bg-foreground text-background hover:bg-foreground/95 focus-within:bg-foreground/95 dark:bg-card dark:text-foreground dark:hover:bg-secondary/55 dark:focus-within:bg-secondary/55"
          : "hover:bg-secondary/55 focus-within:bg-secondary/55",
      )}
    >
      <div className="flex items-start justify-between gap-6 font-mono text-[0.62rem] uppercase tracking-[0.15em]">
        <span
          className={cn(
            "text-muted-foreground",
            index === 0 && "text-background/55 dark:text-muted-foreground",
          )}
        >
          {String(index + 1).padStart(2, "0")} /{" "}
          {t(`categories.${project.category}`)}
        </span>
        {project.stage && (
          <span
            className={cn(
              "text-primary",
              index === 0 && "text-inverse-accent dark:text-primary",
            )}
          >
            {project.stage}
          </span>
        )}
      </div>

      <div className="mt-auto pt-16">
        <h3 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {project.name}
        </h3>
        <p
          className={cn(
            "mt-4 max-w-2xl leading-relaxed text-muted-foreground",
            index === 0 && "text-background/65 dark:text-muted-foreground",
          )}
        >
          {project.longDescription}
        </p>
        {project.proof && (
          <p
            className={cn(
              "mt-6 border-l border-primary pl-4 font-mono text-[0.65rem] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground",
              index === 0 && "text-background/65 dark:text-muted-foreground",
            )}
          >
            {project.proof}
          </p>
        )}
        <div className="mt-7">
          <ProjectLinks project={project} inverse={index === 0} />
        </div>
      </div>
    </article>
  );
}

function DirectoryProject({
  project,
  number,
}: {
  project: Project;
  number: number;
}) {
  const t = useTranslations("ProjectsPage");

  return (
    <details
      id={getProjectAnchor(project.name)}
      className="group scroll-mt-28 border-b border-border transition-colors target:bg-primary/5 target:ring-1 target:ring-primary/30 target:ring-inset"
    >
      <summary className="grid list-none grid-cols-[2rem_minmax(0,1fr)_1.5rem] items-start gap-3 py-5 marker:content-none sm:grid-cols-[3rem_1fr_9rem_2rem] sm:items-center">
        <span className="font-mono text-[0.62rem] text-muted-foreground">
          {String(number).padStart(2, "0")}
        </span>
        <span>
          <span className="block text-lg font-semibold tracking-[-0.03em] transition-colors group-hover:text-primary">
            {project.name}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {project.description}
          </span>
          <span className="mt-2 block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground sm:hidden">
            {t(`categories.${project.category}`)}
          </span>
        </span>
        <span className="hidden font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground sm:block">
          {t(`categories.${project.category}`)}
        </span>
        <span
          aria-hidden="true"
          className="text-right text-lg text-primary transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="grid gap-8 bg-card px-5 py-7 sm:grid-cols-[1.15fr_0.85fr] sm:px-8">
        <div>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {project.longDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {project.tech.map((technology) => (
              <span
                key={technology}
                className="border border-border bg-background px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground"
              >
                {technology}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <ProjectLinks project={project} />
          </div>
        </div>

        <div>
          {project.proof && (
            <p className="mb-5 border-l border-primary pl-4 font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.1em] text-primary">
              {project.proof}
            </p>
          )}
          <ul className="space-y-3 text-sm text-foreground/85">
            {project.features.map((feature) => (
              <li key={feature} className="grid grid-cols-[0.75rem_1fr] gap-2">
                <span className="mt-[0.48rem] h-px bg-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

export function ProjectsView({ projects }: { projects: Project[] }) {
  const t = useTranslations("ProjectsPage");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const revealTargetProject = () => {
      let targetId: string;

      try {
        targetId = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }

      if (!targetId.startsWith("project-")) return;

      const target = document.getElementById(targetId);
      if (!(target instanceof HTMLDetailsElement)) return;

      target.open = true;
      requestAnimationFrame(() => {
        target
          .querySelector<HTMLElement>("summary")
          ?.focus({ preventScroll: true });
      });
    };

    revealTargetProject();
    window.addEventListener("hashchange", revealTargetProject);
    return () => window.removeEventListener("hashchange", revealTargetProject);
  }, []);

  const counts = useMemo(() => {
    return projects.reduce<Record<Filter, number>>(
      (result, project) => {
        result.all += 1;
        result[project.category] += 1;
        return result;
      },
      { all: 0, cli: 0, product: 0, library: 0, "neovim-plugin": 0 },
    );
  }, [projects]);

  const selectedProjects = selectedOrder
    .map((name) => projects.find((project) => project.name === name))
    .filter((project): project is Project => Boolean(project));
  const hasQuery = query.trim().length > 0;

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return projects.filter((project) => {
      const matchesCategory =
        activeFilter === "all" || project.category === activeFilter;
      const searchable = [
        project.name,
        project.description,
        project.longDescription,
        ...project.tech,
        ...project.features,
      ]
        .join(" ")
        .toLocaleLowerCase();

      return (
        matchesCategory &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [activeFilter, projects, query]);

  return (
    <div>
      {activeFilter === "all" && !hasQuery && (
        <section aria-labelledby="selected-work-heading">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t("selectedKicker")}</p>
              <h2
                id="selected-work-heading"
                className="mt-3 text-2xl font-semibold tracking-[-0.04em]"
              >
                {t("selectedTitle")}
              </h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm leading-relaxed text-muted-foreground md:block">
              {t("selectedDescription")}
            </p>
            <a
              href="#project-directory"
              className="border-b border-primary pb-1 text-xs font-semibold text-primary md:hidden"
            >
              {t("directoryTitle")} ↓
            </a>
          </div>

          <div className="hidden gap-3 md:grid lg:grid-cols-12">
            {selectedProjects.map((project, index) => (
              <SelectedProject
                key={project.name}
                project={project}
                index={index}
              />
            ))}
          </div>

          <div className="divide-y divide-border border-y border-border md:hidden">
            {selectedProjects.map((project, index) => (
              <article key={project.name} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {t(`categories.${project.category}`)}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                      {project.name}
                    </h3>
                  </div>
                  {project.stage && (
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-primary">
                      {project.stage}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <div className="mt-4">
                  <ProjectLinks project={project} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section
        id="project-directory"
        className={cn(
          "scroll-mt-28",
          activeFilter === "all" && !hasQuery ? "mt-16 lg:mt-24" : "mt-4",
        )}
        aria-labelledby="project-directory-heading"
      >
        <div className="grid gap-6 border-y border-border py-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label
              htmlFor="project-search"
              className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground"
            >
              {t("searchLabel")}
            </label>
            <input
              id="project-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="mt-2 block h-11 w-full max-w-xl border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring lg:w-[32rem]"
            />
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("filterLabel")}
          >
            {filters
              .filter((filter) => filter === "all" || counts[filter] > 0)
              .map((filter) => {
                const isActive = filter === activeFilter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={isActive}
                    className={cn(
                      "min-h-9 border px-3 font-mono text-[0.62rem] uppercase tracking-[0.1em] transition-colors active:scale-[0.98]",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    {t(`filters.${filter}`)}{" "}
                    <span className="ml-1">{counts[filter]}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border py-5">
          <h2
            id="project-directory-heading"
            className="text-xl font-semibold tracking-[-0.035em]"
          >
            {t("directoryTitle")}
          </h2>
          <p
            className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground"
            aria-live="polite"
          >
            {t("shown", { count: visibleProjects.length })}
          </p>
        </div>

        {visibleProjects.length > 0 ? (
          <div>
            {visibleProjects.map((project, index) => (
              <DirectoryProject
                key={project.name}
                project={project}
                number={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="border-b border-dashed border-border py-16 text-center">
            <p className="text-lg font-semibold">{t("empty")}</p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setQuery("");
              }}
              className="mt-4 border-b border-primary pb-1 text-sm font-semibold text-primary"
            >
              {t("reset")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
