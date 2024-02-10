import { remarkCodeHike } from "@code-hike/mdx"
import {
  defineDocumentType,
  defineNestedType,
  makeSource,
} from "contentlayer/source-files"
import readingTime from "reading-time"
import codeHikeTheme from "./contentlayer.theme"

// TODO: add this back after fixing `ERR_IMPORT_ASSERTION_TYPE_MISSING`
// import codeHikeTheme from "shiki/themes/nord.json" assert {type: "json"};

const getLocale = (path) => {
  const pathArray = path.split(".")
  return pathArray.length > 2 ? pathArray.slice(-2)[0] : "en"
}

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) =>
      `/${doc._raw.flattenedPath.replace(/\.(ru|ar|es)(\.mdx)?$/, "")}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) =>
      doc._raw.flattenedPath
        .split("/")
        .slice(1)
        .join("/")
        .replace(/\.(ru|ar|es)(\.mdx)?$/, ""),
  },
  readingTime: { type: "json", resolve: (doc) => readingTime(doc.body.raw) },
  locale: {
    type: "string",
    resolve: (doc) => {
      return getLocale(doc._raw.sourceFilePath)
    },
  },
}

const SEO = defineNestedType(() => ({
  name: "SEO",
  fields: {
    title: {
      type: "string",
    },

    description: {
      type: "string",
    },
  },
}))

export const Painting = defineDocumentType(() => ({
  name: "Painting",
  filePathPattern: `paintings/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    author: {
      type: "string",
    },
    year: {
      type: "number",
    },
    style: {
      type: "string",
    },
    country: {
      type: "string",
    },
    image: {
      type: "string",
    },
    tags: {
      type: "list",
      of: {
        type: "string",
      },
    },
    seo: {
      type: "nested",
      of: SEO,
    },
  },
  computedFields,
}))

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    tags: {
      type: "list",
      of: {
        type: "string",
      },
    },
    seo: {
      type: "nested",
      of: SEO,
    },
  },
  computedFields,
}))

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    image: {
      type: "string",
    },
    seo: {
      type: "nested",
      of: SEO,
    },
    tags: {
      type: "list",
      of: {
        type: "string",
      },
    },
    public: {
      type: "boolean",
      required: false,
      default: true,
    },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Page, Painting],
  remarkPlugins: [
    [remarkCodeHike, { theme: codeHikeTheme, lineNumbers: false }],
  ],
})
