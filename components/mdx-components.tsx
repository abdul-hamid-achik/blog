import Image from "next/image"
import { useMDXComponent } from "next-contentlayer/hooks"
import Embed from "./embed"

const components = {
  Image,
  Embed,
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)

  return <Component components={components} />
}
