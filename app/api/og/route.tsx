/* eslint-disable @next/next/no-img-element */
// @ts-ignore
import { ImageResponse } from "@vercel/og"
import { allPosts } from "contentlayer/generated"

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const hasTitle = searchParams.has("title")
    const title = hasTitle
    ? searchParams.get("title")?.slice(0, 100)
    : "Abdul Hamid's Blog"

    const post = allPosts.find((post) => post.title === searchParams.get("title"))
    const src = await fetch(new URL("./logo.png", import.meta.url)).then((res) =>
      res.arrayBuffer()
    )

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "black",
            backgroundSize: "150px 150px",
            height: "100%",
            width: "100%",
            display: "flex",
            textAlign: "center",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            flexWrap: "nowrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              justifyItems: "center",
            }}
          >
            <img
              // @ts-ignore
              src={src}
              alt={post?.title ? post?.title : "Abdul Hamid's Blog"}
              height={256}
              style={{ margin: "0 30px" }}
              width={256}
            />
          </div>
          <div
            style={{
              fontSize: 60,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              color: "white",
              marginTop: 30,
              padding: "0 120px",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              fontStyle: "normal",
              letterSpacing: "-0.025em",
              color: "white",
              marginTop: 30,
              padding: "0 120px",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            By Abdul Hamid
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
  }
}
