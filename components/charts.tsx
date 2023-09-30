"use client"

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
  const { data, error } = useQuery(POSTS_OVER_TIME_QUERY)
  const { theme: mode } = useTheme()

  if (error) return <>{error.message}</>

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
  const { data, error } = useQuery(READING_TIME_DISTRIBUTION_QUERY)
  const { theme: mode } = useTheme()

  if (error) return <>{error.message}</>

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
