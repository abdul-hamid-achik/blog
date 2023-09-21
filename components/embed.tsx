"use client"
import React, { useEffect, useRef } from "react"
import ReactDOMServer from "react-dom/server"
type EmbedProps = {
  children: React.ReactNode
}

const Embed: React.FC<EmbedProps> = ({
  children,
}: {
  children: React.ReactNode | React.ReactElement
}) => {
  const embedRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (embedRef.current) {
      const scripts = Array.from(
        embedRef.current.getElementsByTagName("script")
      )
      scripts.forEach((script) => {
        const newScript = document.createElement("script")
        Array.from(script.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        )
        script.parentNode?.replaceChild(newScript, script)
      })
    }
  }, [children])

  const html = ReactDOMServer.renderToString(children as React.ReactElement)

  return (
    <div
      ref={embedRef}
      className="flex justify-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default Embed
