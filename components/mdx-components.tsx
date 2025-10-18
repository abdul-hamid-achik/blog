"use client"

import { Link } from "@/navigation"
import { useMDXComponent } from "@content-collections/mdx/react"
import Image from "next/image"
import { Tweet } from 'react-tweet'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { useMounted } from "@/hooks/use-mounted"

const PostsOverTime = dynamic(() => import('./charts').then(m => m.PostsOverTime), { ssr: false })
const ReadingTimeDistribution = dynamic(() => import('./charts').then(m => m.ReadingTimeDistribution), { ssr: false })
const TopArtists = dynamic(() => import('./charts').then(m => m.TopArtists), { ssr: false })
const TopTags = dynamic(() => import('./charts').then(m => m.TopTags), { ssr: false })
const TopTracks = dynamic(() => import('./charts').then(m => m.TopTracks), { ssr: false })
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
  const mounted = useMounted()

  if (!mounted) {
    return null
  }

  return <Component components={components} />
}
