"use client"

import { useMDXComponent } from "next-contentlayer/hooks"
import Link from 'next-intl/link'
import Image from "next/image"
import { Tweet } from 'react-tweet'
import {
  PostsOverTime, ReadingTimeDistribution
} from "./charts"
import Embed from "./embed"


const components = {
  PostsOverTimeChart: PostsOverTime,
  ReadingTimeDistributionChart: ReadingTimeDistribution,
  Embed,
  Image,
  Link,
  Tweet: ({id}: {id: string}) => <div className="flex w-full justify-center">
    <Tweet id={id}/>
  </div>
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return <Component components={components} />
}
