"use client"

import { Link } from "@/navigation"
import { useMDXComponent } from "@content-collections/mdx/react"
import Image from "next/image"
import { Tweet } from 'react-tweet'
import {
  PostsOverTime, ReadingTimeDistribution, TopArtists, TopTags, TopTracks
} from "./charts"
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
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return <Component components={components} />
}
