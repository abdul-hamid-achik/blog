"use client";

import { useId, type ReactNode } from "react";
import { gql, useQuery } from "@apollo/client";
import { useFormatter, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Alert } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface PostsOverTimeData {
  postsOverTime: Array<{ month: string; count: number }>;
}

interface ReadingTimeDistributionData {
  readingTimeDistribution: Array<{ category: string; count: number }>;
}

interface TopArtistsData {
  topArtists: Array<{ name: string; scrobbles: number }>;
}

interface TopTagsData {
  topTags: Array<{ name: string; count: number }>;
}

interface TopTracksData {
  topTracks: Array<{
    name: string;
    stats: { userPlayCount: number };
    artist: { name: string };
  }>;
}

interface Metric {
  label: string;
  value: string;
}

interface AccessibleDatum {
  label: string;
  value: string;
}

interface RankingDatum {
  name: string;
  value: number;
}

const POSTS_OVER_TIME_QUERY = gql`
  query PostsOverTime {
    postsOverTime {
      month
      count
    }
  }
`;

const READING_TIME_DISTRIBUTION_QUERY = gql`
  query ReadingTimeDistribution {
    readingTimeDistribution {
      category
      count
    }
  }
`;

const TOP_ARTISTS_QUERY = gql`
  query TopArtists {
    topArtists {
      name
      scrobbles
    }
  }
`;

const TOP_TAGS_QUERY = gql`
  query TopTags {
    topTags {
      name
      count
    }
  }
`;

const TOP_TRACKS_QUERY = gql`
  query TopTracks {
    topTracks {
      name
      stats {
        userPlayCount
      }
      artist {
        name
      }
    }
  }
`;

const axisTick = {
  fill: "var(--muted-foreground)",
  fontFamily: "inherit",
  fontSize: 11,
};
const gridColor = "var(--border)";
const primaryColor = "var(--primary)";

function ChartPanel({
  accessibleData,
  children,
  metrics,
  title,
}: {
  accessibleData: AccessibleDatum[];
  children: ReactNode;
  metrics: Metric[];
  title: string;
}) {
  const titleId = useId();

  return (
    <figure
      aria-labelledby={titleId}
      className="not-prose my-10 overflow-hidden border-y border-border bg-background sm:my-12"
    >
      <figcaption className="grid gap-6 border-b border-border px-1 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:px-3 sm:py-6">
        <h3
          id={titleId}
          className="max-w-xl text-balance text-base font-medium leading-snug tracking-tight text-foreground sm:text-lg"
        >
          {title}
        </h3>

        <dl className="grid grid-cols-2 gap-x-7 gap-y-3 sm:min-w-72 sm:justify-self-end">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <dt className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {metric.label}
              </dt>
              <dd
                title={metric.value}
                className="mt-1 truncate text-sm font-medium tabular-nums text-foreground"
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </figcaption>

      <div className="px-0 py-5 sm:px-2 sm:py-7">{children}</div>

      <ol className="sr-only" aria-label={title}>
        {accessibleData.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <span>{item.label}</span> <span>{item.value}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function ChartLoading({ title }: { title: string }) {
  const t = useTranslations("Charts");
  const titleId = useId();

  return (
    <figure
      aria-busy="true"
      aria-labelledby={titleId}
      className="not-prose my-10 overflow-hidden border-y border-border sm:my-12"
    >
      <figcaption className="grid gap-5 border-b border-border px-1 py-5 sm:grid-cols-[minmax(0,1fr)_18rem] sm:items-end sm:px-3 sm:py-6">
        <h3
          id={titleId}
          className="text-base font-medium text-foreground sm:text-lg"
        >
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-6" aria-hidden="true">
          <Skeleton className="h-9 motion-reduce:animate-none" />
          <Skeleton className="h-9 motion-reduce:animate-none" />
        </div>
      </figcaption>
      <div className="space-y-5 px-1 py-8 sm:px-3" aria-hidden="true">
        <Skeleton className="h-3 w-5/6 motion-reduce:animate-none" />
        <Skeleton className="h-3 w-3/5 motion-reduce:animate-none" />
        <Skeleton className="h-3 w-4/6 motion-reduce:animate-none" />
        <Skeleton className="h-40 w-full motion-reduce:animate-none" />
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {t("loading")}
      </span>
    </figure>
  );
}

function ChartMessage({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="not-prose my-10 border-y border-border px-1 py-6 sm:my-12 sm:px-3 sm:py-8"
    >
      <h3
        id={titleId}
        className="text-base font-medium text-foreground sm:text-lg"
      >
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChartError({ title }: { title: string }) {
  const t = useTranslations("Charts");

  return (
    <ChartMessage title={title}>
      <Alert className="border-border bg-muted/40 text-muted-foreground">
        {t("unavailable")}
      </Alert>
    </ChartMessage>
  );
}

function ChartEmpty({ title }: { title: string }) {
  const t = useTranslations("Charts");

  return (
    <ChartMessage title={title}>
      <p role="status" className="text-sm text-muted-foreground">
        {t("empty")}
      </p>
    </ChartMessage>
  );
}

function shortenLabel(value: string) {
  return value.length > 19 ? `${value.slice(0, 18)}…` : value;
}

function parseMonth(value: string) {
  const match = /^(\d{4})-(\d{1,2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return {
    date: new Date(Date.UTC(year, month - 1, 1)),
    order: year * 12 + month,
  };
}

export function PostsOverTime() {
  const t = useTranslations("Charts");
  const format = useFormatter();
  const title = t("postsOverTime");
  const { data, error, loading } = useQuery<PostsOverTimeData>(
    POSTS_OVER_TIME_QUERY,
  );

  if (loading) return <ChartLoading title={title} />;
  if (error) return <ChartError title={title} />;

  const points = (data?.postsOverTime ?? [])
    .map((point) => {
      const parsedMonth = parseMonth(point.month);
      return {
        count: point.count,
        month: parsedMonth
          ? format.dateTime(parsedMonth.date, {
              month: "short",
              timeZone: "UTC",
              year: "numeric",
            })
          : point.month,
        order: parsedMonth?.order ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((left, right) => left.order - right.order);

  if (points.length === 0) return <ChartEmpty title={title} />;

  const total = points.reduce((sum, point) => sum + point.count, 0);
  const peak = points.reduce((current, point) =>
    point.count > current.count ? point : current,
  );
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  return (
    <ChartPanel
      title={title}
      metrics={[
        { label: t("posts"), value: formatCount(total) },
        {
          label: t("peak"),
          value: `${formatCount(peak.count)} · ${peak.month}`,
        },
      ]}
      accessibleData={points.map((point) => ({
        label: point.month,
        value: formatCount(point.count),
      }))}
    >
      <ChartContainer className="h-72 sm:h-80" role="group" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            accessibilityLayer
            data={points}
            desc={title}
            margin={{ top: 12, right: 12, left: -14, bottom: 4 }}
            tabIndex={0}
          >
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="2 6"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickMargin={12}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickMargin={8}
              width={40}
            />
            <ChartTooltip
              cursor={{ stroke: gridColor, strokeDasharray: "3 4" }}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    typeof value === "number" ? formatCount(value) : value
                  }
                />
              }
            />
            <Line
              type="monotone"
              dataKey="count"
              name={t("posts")}
              stroke={primaryColor}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ fill: primaryColor, r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartPanel>
  );
}

export function ReadingTimeDistribution() {
  const t = useTranslations("Charts");
  const format = useFormatter();
  const title = t("readingTime");
  const { data, error, loading } = useQuery<ReadingTimeDistributionData>(
    READING_TIME_DISTRIBUTION_QUERY,
  );

  if (loading) return <ChartLoading title={title} />;
  if (error) return <ChartError title={title} />;

  const localizeCategory = (category: string) => {
    switch (category) {
      case "0-2 minutes":
        return t("minuteRange", { start: 0, end: 2 });
      case "2-5 minutes":
        return t("minuteRange", { start: 2, end: 5 });
      case "5-10 minutes":
        return t("minuteRange", { start: 5, end: 10 });
      case "10+ minutes":
        return t("minutesOrMore", { count: 10 });
      default:
        return category;
    }
  };
  const points = (data?.readingTimeDistribution ?? []).map((point) => ({
    category: localizeCategory(point.category),
    count: point.count,
  }));

  if (points.length === 0) return <ChartEmpty title={title} />;

  const total = points.reduce((sum, point) => sum + point.count, 0);
  const largestGroup = points.reduce((current, point) =>
    point.count > current.count ? point : current,
  );
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });

  return (
    <ChartPanel
      title={title}
      metrics={[
        { label: t("posts"), value: formatCount(total) },
        {
          label: t("mostCommon"),
          value: `${largestGroup.category} · ${formatCount(largestGroup.count)}`,
        },
      ]}
      accessibleData={points.map((point) => ({
        label: point.category,
        value: formatCount(point.count),
      }))}
    >
      <ChartContainer className="h-72 sm:h-80" role="group" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={points}
            desc={title}
            margin={{ top: 12, right: 12, left: -14, bottom: 4 }}
            tabIndex={0}
          >
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="2 6"
              vertical={false}
            />
            <XAxis
              dataKey="category"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              interval={0}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickMargin={8}
              width={40}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.65 }}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    typeof value === "number" ? formatCount(value) : value
                  }
                />
              }
            />
            <Bar
              dataKey="count"
              name={t("posts")}
              fill={primaryColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={56}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartPanel>
  );
}

function HorizontalRankingChart({
  data,
  metricLabel,
  title,
}: {
  data: RankingDatum[];
  metricLabel: string;
  title: string;
}) {
  const t = useTranslations("Charts");
  const format = useFormatter();
  const rows = [...data]
    .filter((item) => Number.isFinite(item.value))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  if (rows.length === 0) return <ChartEmpty title={title} />;

  const leader = rows[0];
  const formatCount = (value: number) =>
    format.number(value, { maximumFractionDigits: 0 });
  const formatAxisCount = (value: number) =>
    format.number(value, {
      maximumFractionDigits: 1,
      notation: "compact",
    });

  return (
    <ChartPanel
      title={title}
      metrics={[
        { label: metricLabel, value: formatCount(leader.value) },
        { label: t("leader"), value: leader.name },
      ]}
      accessibleData={rows.map((row) => ({
        label: row.name,
        value: formatCount(row.value),
      }))}
    >
      <ChartContainer
        className="h-[26rem] sm:h-[30rem]"
        role="group"
        aria-label={title}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            layout="vertical"
            data={rows}
            desc={title}
            margin={{ top: 4, right: 14, left: 0, bottom: 4 }}
            tabIndex={0}
            barCategoryGap="34%"
          >
            <CartesianGrid
              stroke={gridColor}
              strokeDasharray="2 6"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={axisTick}
              tickFormatter={formatAxisCount}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickMargin={10}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tick={axisTick}
              tickFormatter={shortenLabel}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.65 }}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) =>
                    typeof value === "number" ? formatCount(value) : value
                  }
                />
              }
            />
            <Bar
              dataKey="value"
              name={metricLabel}
              fill={primaryColor}
              radius={[0, 3, 3, 0]}
              maxBarSize={20}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartPanel>
  );
}

export function TopArtists() {
  const t = useTranslations("Charts");
  const title = t("topArtists");
  const { data, error, loading } = useQuery<TopArtistsData>(TOP_ARTISTS_QUERY);

  if (loading) return <ChartLoading title={title} />;
  if (error) return <ChartError title={title} />;

  return (
    <HorizontalRankingChart
      data={(data?.topArtists ?? []).map((artist) => ({
        name: artist.name,
        value: artist.scrobbles,
      }))}
      metricLabel={t("scrobbles")}
      title={title}
    />
  );
}

export function TopTags() {
  const t = useTranslations("Charts");
  const title = t("topTags");
  const { data, error, loading } = useQuery<TopTagsData>(TOP_TAGS_QUERY);

  if (loading) return <ChartLoading title={title} />;
  if (error) return <ChartError title={title} />;

  return (
    <HorizontalRankingChart
      data={(data?.topTags ?? []).map((tag) => ({
        name: tag.name,
        value: tag.count,
      }))}
      metricLabel={t("uses")}
      title={title}
    />
  );
}

export function TopTracks() {
  const t = useTranslations("Charts");
  const title = t("topTracks");
  const { data, error, loading } = useQuery<TopTracksData>(TOP_TRACKS_QUERY);

  if (loading) return <ChartLoading title={title} />;
  if (error) return <ChartError title={title} />;

  return (
    <HorizontalRankingChart
      data={(data?.topTracks ?? []).map((track) => ({
        name: `${track.name} · ${track.artist.name}`,
        value: track.stats.userPlayCount,
      }))}
      metricLabel={t("plays")}
      title={title}
    />
  );
}
