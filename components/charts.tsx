"use client"

import { gql, useQuery } from "@apollo/client"
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
} from "recharts"

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
  const { data } = useQuery(
    POSTS_OVER_TIME_QUERY
  )

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
      <Line type="monotone" dataKey="count" stroke="#8884d8" />
    </LineChart>
  )
}

export function ReadingTimeDistribution() {
  const { data } = useQuery(
    READING_TIME_DISTRIBUTION_QUERY
  )

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
      <Legend />
      <Bar dataKey="count" fill="#8884d8" />
    </BarChart>
  )
}
