import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";
import { ContentType, Locale } from "./lib/data";

const posts = defineCollection({
    name: "posts",
    directory: "content/posts",
    include: "**/*.mdx",
    schema: z.object({
        title: z.string(),
        description: z.string().optional().nullable(),
        date: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
        public: z.boolean().default(true),
    }),
    transform: async (document, context) => {
        const getLocale = (path: string): Locale => {
            const pathArray = path.split(".");
            const locale = pathArray.length > 2 ? pathArray.slice(-2)[0] : Locale.EN;
            return locale as Locale;
        };

        const mdx = await compileMDX(context, document);

        return {
            ...document,
            mdx,
            slug: `/${document._meta.path.replace(/\.(ru|ar|es)(\.mdx)?$/, "")}`,
            slugAsParams: document._meta.path
                .split("/")
                .slice(1)
                .join("/")
                .replace(/\.(ru|ar|es)(\.mdx)?$/, ""),
            readingTime: {
                text: "1 min read",
                minutes: 1,
                time: 60000,
                words: 150
            },
            locale: getLocale(document._meta.filePath),
            type: ContentType.POST,
        };
    },
});

const pages = defineCollection({
    name: "pages",
    directory: "content/pages",
    include: "**/*.mdx",
    schema: z.object({
        title: z.string(),
        description: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
    }),
    transform: async (document, context) => {
        const getLocale = (path: string): Locale => {
            const pathArray = path.split(".");
            const locale = pathArray.length > 2 ? pathArray.slice(-2)[0] : Locale.EN;
            return locale as Locale;
        };

        const mdx = await compileMDX(context, document);

        return {
            ...document,
            mdx,
            slug: `/${document._meta.path.replace(/\.(ru|ar|es)(\.mdx)?$/, "")}`,
            slugAsParams: document._meta.path
                .split("/")
                .slice(1)
                .join("/")
                .replace(/\.(ru|ar|es)(\.mdx)?$/, ""),
            locale: getLocale(document._meta.filePath),
            type: ContentType.PAGE,
        };
    },
});

const paintings = defineCollection({
    name: "paintings",
    directory: "content/paintings",
    include: "**/*.mdx",
    schema: z.object({
        title: z.string(),
        description: z.string().optional().nullable(),
        author: z.string().optional().nullable(),
        year: z.number().optional().nullable(),
        style: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
        tags: z.array(z.string()).optional(),
    }),
    transform: async (document, context) => {
        const getLocale = (path: string): Locale => {
            const pathArray = path.split(".");
            const locale = pathArray.length > 2 ? pathArray.slice(-2)[0] : Locale.EN;
            return locale as Locale;
        };

        const mdx = await compileMDX(context, document);

        return {
            ...document,
            mdx,
            slug: `/${document._meta.path.replace(/\.(ru|ar|es)(\.mdx)?$/, "")}`,
            slugAsParams: document._meta.path
                .split("/")
                .slice(1)
                .join("/")
                .replace(/\.(ru|ar|es)(\.mdx)?$/, ""),
            locale: getLocale(document._meta.filePath),
            type: ContentType.PAINTING,
        };
    },
});

export default defineConfig({
    collections: [posts, pages, paintings],
});
