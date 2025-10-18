/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og"
import { allPages, allPaintings, allPosts } from "content-collections"

// Create allDocuments by combining all collections
const allDocuments = [...allPosts, ...allPages, ...allPaintings]

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const hasTitle = searchParams.has("title")
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "Abdul Hamid's Blog"

    const document = allDocuments.find(
      (document) => document.title === searchParams.get("title")
    )
    const src = await fetch(new URL("./logo.png", import.meta.url)).then(
      (res) => res.arrayBuffer()
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
              src={src as any}
              alt={document?.title ? document?.title : "Abdul Hamid's Blog"}
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
    console.error(e)
    return new Response(undefined)
  }
}
