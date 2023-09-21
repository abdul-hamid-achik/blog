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

export function PostsOverTime() {
  const { data, error } = useQuery(POSTS_OVER_TIME_QUERY)
  const { theme: mode } = useTheme()

  if (error) return <>error.message</>

  return (
    <LineChart
      width={500}
      height={300}
      data={data?.postsOverTime || []}
      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
    >
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="count" style={
                    {
                      fill: "var(--theme-primary)",
                      opacity: 1,
                      "--theme-primary": `hsl(${
                        mode === "dark" ? "210 40% 98%" : "222.2 47.4% 11.2%"
                      })`,
                    } as React.CSSProperties
                  } />
    </LineChart>
  )
}

export function ReadingTimeDistribution() {
  const { data, error } = useQuery(READING_TIME_DISTRIBUTION_QUERY)
  const { theme: mode } = useTheme()

  if (error) return <>error.message</>

  return (
    <BarChart
      width={500}
      height={300}
      data={data?.readingTimeDistribution || []}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="category" />
      <YAxis />
      <Tooltip />
      <Legend  />
      <Bar dataKey="count" style={
                    {
                      fill: "var(--theme-primary)",
                      opacity: 1,
                      "--theme-primary": `hsl(${
                        mode === "dark" ? "210 40% 98%" : "222.2 47.4% 11.2%"
                      })`,
                    } as React.CSSProperties
                  } />
    </BarChart>
  )
}
