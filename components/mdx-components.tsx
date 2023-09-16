"use client"

import { useMDXComponent } from "next-contentlayer/hooks"
import Link from 'next-intl/link'
import Image from "next/image"
import * as Charts from "./charts"
import Embed from "./embed"

const components = {
  Image,
  Embed,
  Charts,
  Link
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return <Component components={components} />
}
