"use client"

import { Link } from "@/navigation"
import { useMDXComponent } from "@content-collections/mdx/react"
import Image from "next/image"
import { Tweet } from 'react-tweet'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const PostsOverTime = dynamic(() => import('./charts').then(m => m.PostsOverTime), { ssr: false, loading: () => <Skeleton className="h-[200px] my-10" /> })
const ReadingTimeDistribution = dynamic(() => import('./charts').then(m => m.ReadingTimeDistribution), { ssr: false, loading: () => <Skeleton className="h-[200px] my-10" /> })
const TopArtists = dynamic(() => import('./charts').then(m => m.TopArtists), { ssr: false, loading: () => <Skeleton className="h-[200px] my-10" /> })
const TopTags = dynamic(() => import('./charts').then(m => m.TopTags), { ssr: false, loading: () => <Skeleton className="h-[200px] my-10" /> })
const TopTracks = dynamic(() => import('./charts').then(m => m.TopTracks), { ssr: false, loading: () => <Skeleton className="h-[200px] my-10" /> })
import Embed from "./embed"


const components = {
  TopArtistsChart: TopArtists,
  TopTagsChart: TopTags,
  TopTracksChart: TopTracks,
  PostsOverTimeChart: PostsOverTime,
  ReadingTimeDistributionChart: ReadingTimeDistribution,
  Embed,
  Image,
  Link,
  Tweet: ({ id }: { id: string }) => <div className="flex w-full justify-center">
    <Tweet id={id} />
  </div>
} as const

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return <Component components={components} />
}
