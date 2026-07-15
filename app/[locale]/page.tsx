import { AuthNotice } from "@/components/auth-notice";
import { getPosts } from "@/lib/data";
import { localizeProjects } from "@/lib/project-translations";
import { flagshipProjectOrder, projects } from "@/lib/projects";
import { Link, locales } from "@/navigation";
import { DateTime } from "luxon";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const systemSteps = [
  { number: "01", key: "frame", projects: ["bob"] },
  { number: "02", key: "coordinate", projects: ["cortex", "mcphub"] },
  { number: "03", key: "verify", projects: ["cairntrace", "glyphrun"] },
  {
    number: "04",
    key: "operate",
    projects: ["monitor", "tinyvault", "file.cheap", "local-agent"],
  },
] as const;

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = locales.some((candidate) => candidate === locale);

  if (!isValidLocale) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "HomePage" });
  const localizedProjects = localizeProjects(projects, locale);
  const posts = (getPosts({ locale, public: true }) ?? []).sort(
    (first, second) => {
      const firstDate = DateTime.fromISO(first.date || "");
      const secondDate = DateTime.fromISO(second.date || "");
      return secondDate.toMillis() - firstDate.toMillis();
    },
  );
  const [leadPost, ...secondaryPosts] = posts;
  const flagships = flagshipProjectOrder
    .map((name) => localizedProjects.find((project) => project.name === name))
    .filter((project): project is (typeof localizedProjects)[number] =>
      Boolean(project),
    );
  const deployedProjects = localizedProjects
    .filter(
      (
        project,
      ): project is (typeof localizedProjects)[number] & { website: string } =>
        Boolean(project.website),
    )
    .sort((first, second) => {
      const firstIndex = flagshipProjectOrder.findIndex(
        (name) => name === first.name,
      );
      const secondIndex = flagshipProjectOrder.findIndex(
        (name) => name === second.name,
      );
      const normalizedFirst =
        firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
      const normalizedSecond =
        secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;

      return (
        normalizedFirst - normalizedSecond ||
        first.name.localeCompare(second.name)
      );
    });

  return (
    <div>
      <Suspense fallback={null}>
        <AuthNotice />
      </Suspense>
      <section className="site-shell grid min-h-[calc(100dvh-8rem)] gap-12 border-x border-border px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:items-center lg:gap-16 lg:px-12 lg:py-24">
        <div className="max-w-4xl">
          <p className="eyebrow">{t("kicker")}</p>
          <h1 className="display-title mt-7 text-balance">{t("title")}</h1>
          <p className="mt-8 max-w-[62ch] text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t("description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background active:scale-[0.98]"
            >
              {t("primaryCta")}
              <span aria-hidden="true" className="ml-5">
                ↗
              </span>
            </Link>
            <Link
              href="#latest-writing"
              className="inline-flex min-h-11 items-center border border-border bg-card px-5 text-sm font-semibold transition-colors hover:border-foreground/40 active:scale-[0.98]"
            >
              {t("secondaryCta")}
              <span aria-hidden="true" className="ml-5">
                ↓
              </span>
            </Link>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-3 border-y border-border py-5">
            <div>
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                {t("projectsLabel")}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                {projects.length}
              </dd>
            </div>
            <div className="border-l border-border pl-5">
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                {t("languagesLabel")}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                3
              </dd>
            </div>
            <div className="border-l border-border pl-5">
              <dt className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-muted-foreground">
                {t("principleLabel")}
              </dt>
              <dd className="mt-2 text-sm font-semibold tracking-[-0.02em] sm:text-base">
                {t("principleValue")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="paper-surface relative lg:rotate-[1deg]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 font-mono text-[0.64rem] uppercase tracking-[0.16em] text-muted-foreground">
            <span>{t("workshopIndex")}</span>
            <span className="inline-flex items-center gap-2 text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("active")}
            </span>
          </div>
          <div className="divide-y divide-border">
            {flagships.slice(0, 6).map((project, index) => (
              <a
                key={project.name}
                href={project.website}
                target="_blank"
                rel="noreferrer"
                className="group grid grid-cols-[2rem_1fr_auto] items-start gap-3 px-5 py-4 transition-colors hover:bg-secondary/70 active:scale-[0.99]"
              >
                <span className="pt-0.5 font-mono text-[0.62rem] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-semibold tracking-[-0.025em]">
                    {project.name}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {project.description}
                  </span>
                </span>
                <span className="font-mono text-xs text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <span aria-hidden="true">↗</span>
                </span>
              </a>
            ))}
          </div>
          <div className="border-t border-border bg-secondary/50 px-5 py-3 font-mono text-[0.62rem] uppercase tracking-[0.13em] text-muted-foreground">
            <a
              href="#live-projects"
              className="flex items-center justify-between gap-4 transition-colors hover:text-foreground"
            >
              {t("workshopFooter", {
                count: deployedProjects.length,
                shown: Math.min(6, flagships.length),
              })}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-foreground text-background dark:bg-card dark:text-foreground">
        <div className="site-shell grid gap-10 px-5 py-20 sm:px-8 lg:min-h-[64rem] lg:grid-cols-[0.75fr_1.25fr] lg:items-stretch lg:px-12 lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-inverse-accent">{t("systemKicker")}</p>
            <h2 className="section-title mt-6 max-w-lg">{t("systemTitle")}</h2>
            <p className="mt-6 max-w-md leading-relaxed text-background/65 dark:text-muted-foreground">
              {t("systemDescription")}
            </p>
          </div>

          <div className="border-t border-background/25 dark:border-border lg:grid lg:grid-rows-4">
            {systemSteps.map((step) => (
              <div
                key={step.number}
                className="grid gap-5 border-b border-background/25 py-7 dark:border-border sm:grid-cols-[3rem_0.9fr_1.1fr] sm:items-start lg:items-center"
              >
                <span className="font-mono text-xs text-inverse-accent">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.035em]">
                    {t(`steps.${step.key}.title`)}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.projects.map((project) => (
                      <span
                        key={project}
                        className="border border-background/25 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-background/70 dark:border-border dark:text-muted-foreground"
                      >
                        {project}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-background/65 dark:text-muted-foreground">
                  {t(`steps.${step.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="live-projects"
        className="site-shell scroll-mt-24 border-x border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="eyebrow">{t("deployedKicker")}</p>
            <h2 className="section-title mt-6 max-w-xl">
              {t("deployedTitle")}
            </h2>
          </div>
          <div className="flex flex-col items-start justify-between gap-5 lg:border-l lg:border-border lg:pl-6 xl:flex-row xl:items-end">
            <p className="max-w-2xl leading-relaxed text-muted-foreground">
              {t("deployedDescription")}
            </p>
            <span className="shrink-0 border border-border bg-card px-3 py-2 font-mono text-[0.64rem] uppercase tracking-[0.13em] text-muted-foreground">
              {t("deployedCount", { count: deployedProjects.length })}
            </span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px border border-border bg-border xl:grid-cols-4">
          {deployedProjects.map((project, index) => (
            <a
              key={project.name}
              href={project.website}
              target="_blank"
              rel="noreferrer"
              aria-label={t("visitProject", { name: project.name })}
              className="group flex min-h-32 flex-col bg-background p-3 transition-colors hover:bg-card focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-44 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[0.62rem] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                >
                  ↗
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-[-0.03em] sm:mt-5 sm:text-lg">
                {project.name}
              </h3>
              <p className="mt-2 hidden line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:block">
                {project.description}
              </p>
              <span className="mt-auto break-all pt-4 font-mono text-[0.54rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors group-hover:text-primary sm:pt-5 sm:text-[0.62rem] sm:tracking-[0.1em]">
                {new URL(project.website).hostname.replace(/^www\./, "")}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section
        id="latest-writing"
        className="site-shell scroll-mt-28 border-x border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
      >
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="eyebrow">{t("writingKicker")}</p>
            <h2 className="section-title mt-6">{t("writingTitle")}</h2>
          </div>
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end lg:border-l lg:border-border lg:pl-6">
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              {t("writingDescription")}
            </p>
            <Link
              href="/essays"
              className="shrink-0 border-b border-primary pb-1 text-sm font-semibold text-primary"
            >
              {t("allWriting")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        {leadPost ? (
          <div className="mt-12 grid border-y border-border lg:grid-cols-[1.15fr_0.85fr]">
            <Link
              href={`/posts/${leadPost.slugAsParams}`}
              aria-label={`${t("latest")}: ${leadPost.title}`}
              className="group relative min-h-[22rem] overflow-hidden border-b border-border bg-secondary lg:min-h-[34rem] lg:border-r lg:border-b-0"
            >
              {leadPost.image ? (
                <Image
                  src={leadPost.image}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("essay")}
                </div>
              )}
              <span className="absolute top-4 left-4 bg-foreground px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-background">
                {t("latest")}
              </span>
            </Link>

            <article className="flex flex-col justify-end bg-card p-6 sm:p-10 lg:p-12">
              <div className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted-foreground">
                {leadPost.date && formatDate(leadPost.date, locale)}
                <span className="mx-2 text-border">/</span>
                {leadPost.readingTime.text}
              </div>
              <Link href={`/posts/${leadPost.slugAsParams}`}>
                <h3 className="mt-5 text-3xl font-semibold leading-[1.03] tracking-[-0.045em] transition-colors hover:text-primary sm:text-4xl">
                  {leadPost.title}
                </h3>
              </Link>
              {leadPost.description && (
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  {leadPost.description}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-2">
                {leadPost.tags?.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="border border-border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <div className="mt-12 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t("emptyWriting")}
          </div>
        )}

        <div className="divide-y divide-border border-b border-border">
          {secondaryPosts.slice(0, 4).map((post, index) => (
            <article
              key={post._meta.path}
              className="group grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
            >
              <span className="font-mono text-[0.62rem] text-muted-foreground">
                {String(index + 2).padStart(2, "0")}
              </span>
              <div>
                <Link href={`/posts/${post.slugAsParams}`}>
                  <h3 className="text-xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-primary sm:text-2xl">
                    {post.title}
                  </h3>
                </Link>
                {post.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                )}
              </div>
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground sm:text-right">
                {post.date && <span>{formatDate(post.date, locale)}</span>}
                <span className="mx-2 text-border">/</span>
                <span>{post.readingTime.text}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="site-shell grid gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-12 lg:py-24">
          <div>
            <p className="eyebrow">{t("aboutKicker")}</p>
            <h2 className="section-title mt-6 max-w-4xl">{t("aboutTitle")}</h2>
          </div>
          <div className="lg:border-l lg:border-border lg:pl-6">
            <p className="leading-relaxed text-muted-foreground">
              {t("aboutDescription")}
            </p>
            <Link
              href="/about"
              className="mt-7 inline-block border-b border-primary pb-1 text-sm font-semibold text-primary"
            >
              {t("aboutCta")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
