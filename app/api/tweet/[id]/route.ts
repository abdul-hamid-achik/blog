import { getTweet } from "react-tweet/api";

const TWEET_ID_PATTERN = /^\d{10,25}$/;

interface TweetRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: TweetRouteProps) {
  const { id } = await params;

  if (!TWEET_ID_PATTERN.test(id)) {
    return Response.json(
      { data: null, error: "Invalid tweet ID" },
      { status: 400 },
    );
  }

  try {
    const tweet = await getTweet(id);

    return Response.json(
      { data: tweet ?? null },
      {
        status: tweet ? 200 : 404,
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return Response.json(
      { data: null, error: "Tweet unavailable" },
      {
        status: 502,
        headers: { "Cache-Control": "public, s-maxage=300" },
      },
    );
  }
}
