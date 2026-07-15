"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

function ChartFallback() {
  return <Skeleton className="my-10 h-[220px] w-full" />;
}

export const PostsOverTimeChart = dynamic(
  () => import("./charts").then((module) => module.PostsOverTime),
  { ssr: false, loading: ChartFallback },
);

export const ReadingTimeDistributionChart = dynamic(
  () => import("./charts").then((module) => module.ReadingTimeDistribution),
  { ssr: false, loading: ChartFallback },
);

export const TopArtistsChart = dynamic(
  () => import("./charts").then((module) => module.TopArtists),
  { ssr: false, loading: ChartFallback },
);

export const TopTagsChart = dynamic(
  () => import("./charts").then((module) => module.TopTags),
  { ssr: false, loading: ChartFallback },
);

export const TopTracksChart = dynamic(
  () => import("./charts").then((module) => module.TopTracks),
  { ssr: false, loading: ChartFallback },
);

const TweetWidget = dynamic(
  () => import("react-tweet").then((module) => module.Tweet),
  {
    ssr: false,
    loading: () => <Skeleton className="my-8 h-72 w-full max-w-xl" />,
  },
);

export function EmbeddedTweet({ id }: { id: string }) {
  return <TweetWidget id={id} apiUrl={`/api/tweet/${id}`} />;
}
