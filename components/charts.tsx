"use client"

import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { gql, useQuery } from "@apollo/client";
import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


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
    <div className="h-[200px] my-10">
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
    </div>
  )
}
export function ReadingTimeDistribution() {
  const { data, error, loading } = useQuery(READING_TIME_DISTRIBUTION_QUERY)
  const { theme: mode } = useTheme()

  if (loading) return <Skeleton className="h-[200px] my-10" />
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>

  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  return (
    <div className="h-[200px] my-10">
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
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const totalPosts = data?.readingTimeDistribution?.reduce((total: number, item: { count: number }) => total + item.count, 0) || 0;
                const percentage = (((payload[0]?.value || 0) as number) / totalPosts * 100).toFixed(2);
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Category
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].payload.category}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Count
                        </span>
                        <span className="font-bold">
                          {payload[0].value} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              return null
            }}
          />

          <Legend
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
    </div>
  )
}

export const TopArtists = () => {
  const { loading, error, data } = useQuery(TOP_ARTISTS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <div className="h-[200px] my-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topArtists} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white dark:bg-gray-800 p-2 rounded shadow text-sm">
                    <div className="flex items-center">
                      <div className="mr-2">
                        <span className="font-bold">
                          {data.name}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">
                          {data.scrobbles} scrobbles
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              return null
            }}
          />
          <Legend
            wrapperStyle={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
          <Bar
            dataKey="scrobbles"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TopTags = () => {
  const { loading, error, data } = useQuery(TOP_TAGS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <div className="h-[200px] my-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topTags} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-md text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <div className="text-muted-foreground">{`${label} : ${payload[0].value}`}</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
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
    </div>
  );
};

export const TopTracks = () => {
  const { loading, error, data } = useQuery(TOP_TRACKS_QUERY);
  const { theme: mode } = useTheme()
  const hsl = theme?.cssVars[mode === "dark" ? "dark" : "light"].primary

  if (loading) return <Skeleton className="h-[200px] my-10" />;
  if (error) return <Alert variant="destructive" className="h-[200px] my-10">{error.message}</Alert>;

  return (
    <div className="h-[200px] my-10">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={data.topTracks} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white dark:bg-gray-800 p-2 rounded shadow text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="mr-2">
                        <span className="font-bold">
                          {data.name}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">
                          {data.stats.userPlayCount} plays
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">
                          {data.artist.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            wrapperStyle={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
          <Bar
            dataKey="stats.userPlayCount"
            fill="var(--theme-primary)"
            style={{
              fill: "var(--theme-primary)",
              opacity: 1,
              "--theme-primary": `hsl(${hsl})`,
            } as React.CSSProperties}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


