import { Link } from "@/navigation";
import { useMDXComponent } from "@content-collections/mdx/react";
import Image from "next/image";
import type { ComponentProps } from "react";
import {
  EmbeddedTweet,
  PostsOverTimeChart,
  ReadingTimeDistributionChart,
  TopArtistsChart,
  TopTagsChart,
  TopTracksChart,
} from "./mdx-widgets";
import Embed from "./embed";

type MdxImageProps = ComponentProps<typeof Image> & {
  caption?: string;
};

type MdxAnchorProps = ComponentProps<"a">;

function MdxAnchor({ href, children, ...props }: MdxAnchorProps) {
  if (href?.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function MdxImage({ caption, alt, ...props }: MdxImageProps) {
  return (
    <figure>
      <Image alt={alt} {...props} />
      {caption && (
        <figcaption className="mt-3 text-center font-mono text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

const components = {
  TopArtistsChart,
  TopTagsChart,
  TopTracksChart,
  PostsOverTimeChart,
  ReadingTimeDistributionChart,
  Embed,
  Image: MdxImage,
  a: MdxAnchor,
  Link,
  Tweet: ({ id }: { id: string }) => (
    <div className="not-prose flex w-full justify-center py-6">
      <EmbeddedTweet id={id} />
    </div>
  ),
} as const;

interface MdxProps {
  code: string;
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}
