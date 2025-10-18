"use client"

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { gql, useQuery } from "@apollo/client";
import { useTheme } from "next-themes";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend } from "@/components/ui/chart";


interface PostsOverTime {
  month: string
  count: number
}

interface ReadingTimeDistribution {
  category: string
  count: number
}

const POSTS_OVER_TIME_QUERY = gql`
  query PostsOverTime {
    postsOverTime {
      month
      count
    }
  }
`

const READING_TIME_DISTRIBUTION_QUERY = gql`
  query ReadingTimeDistribution {
    readingTimeDistribution {
      category
      count
    }
  }
`

const TOP_ARTISTS_QUERY = gql`
  query TopArtists {
    topArtists {
      rank
      name
      scrobbles
      url
    }
  }
`;

const TOP_TAGS_QUERY = gql`
  query TopTags {
    topTags {
      name
      count
      url
    }
  }
`;

const TOP_TRACKS_QUERY = gql`
  query TopTracks {
    topTracks {
      rank
      name
      stats {
        duration
        userPlayCount
      }
      artist {
        name
        url
      }
      url
    }
  }
`;

const theme = {
  cssVars: {
    dark: {
      primary: "210 40% 98%"
    },
    light: {
      primary: "222.2 47.4% 11.2%"
    }
  }
}

export function PostsOverTime() {
  const { data, error, loading } = useQuery(POSTS_OVER_TIME_QUERY)
  const { theme: mode } = useTheme()

  if (loading) return <Skeleton className="h-[200px] my-10" />
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>

  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  return (
    <ChartContainer className="my-10 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data?.postsOverTime || []}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend />
          <Line
            type="monotone"
            dataKey="count"
            strokeWidth={2}
            activeDot={{
              r: 8,
              style: { fill: "var(--theme-primary)" },
            }}
            style={{
              stroke: "var(--theme-primary)",
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
export function ReadingTimeDistribution() {
  const { data, error, loading } = useQuery(READING_TIME_DISTRIBUTION_QUERY)
  const { theme: mode } = useTheme()

  if (loading) return <Skeleton className="h-[200px] my-10" />
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>

  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  return (
    <ChartContainer className="my-10 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data?.readingTimeDistribution || []}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />

          <ChartLegend
            wrapperStyle={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
          <Bar
            dataKey="count"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export const TopArtists = () => {
  const { loading, error, data } = useQuery(TOP_ARTISTS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <ChartContainer className="my-10 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topArtists} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend />
          <Bar
            dataKey="scrobbles"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const TopTags = () => {
  const { loading, error, data } = useQuery(TOP_TAGS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <ChartContainer className="my-10 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topTags} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend />
          <Bar
            dataKey="count"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const TopTracks = () => {
  const { loading, error, data } = useQuery(TOP_TRACKS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <ChartContainer className="my-10 h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topTracks} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend />
          <Bar
            dataKey="stats.userPlayCount"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};


