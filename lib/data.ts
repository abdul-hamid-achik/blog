import {
  allPages as pages,
  allPaintings as paintings,
  allPosts as posts,
  allPrompts as prompts,
} from "content-collections";
export { ContentType, Locale } from "./types";
import { ContentType, Locale } from "./types";

const allDocuments = [...posts, ...pages, ...paintings, ...prompts];

type Posts = typeof posts;
type Prompts = typeof prompts;
type Content = typeof allDocuments;

type ContentWithId<T> = T extends readonly (infer U)[]
  ? (U & { _id: string })[]
  : T & { _id: string };

export type { Content, Posts, ContentWithId, Prompts };
export interface BaseParams {
  slug?: string;
  locale?: string;
}

export interface PostParams extends BaseParams {
  tag?: string;
  title?: string;
  description?: string;
  date?: string;
  public?: boolean;
}

export type PageParams = BaseParams;
export function getPost(params: BaseParams) {
  const { slug, locale } = params;

  const post = posts.find(
    (post) =>
      post.slug.includes(slug ?? "") && post.locale === (locale ?? Locale.EN),
  );

  if (!post) {
    return null;
  }

  return post;
}

export function getPosts(params?: PostParams) {
  const {
    slug,
    tag,
    locale,
    title,
    description,
    date,
    public: isPublic,
  } = params ?? {};

  const filteredPosts = posts.filter((post) => {
    const matchesSlug = slug ? post.slug.includes(slug) : true;
    const matchesTag = tag ? post.tags?.includes(tag) : true;
    const matchesLocale = locale ? post.locale === locale : true;
    const matchesTitle = title ? post.title.includes(title) : true;
    const matchesDescription = description
      ? post.description?.includes(description)
      : true;
    const matchesDate = date ? post.date === date : true;
    const matchesPublic =
      isPublic !== undefined ? post.public === isPublic : post.public === true;
    return (
      matchesSlug &&
      matchesTag &&
      matchesLocale &&
      matchesTitle &&
      matchesDescription &&
      matchesDate &&
      matchesPublic
    );
  });

  if (filteredPosts.length === 0) {
    return null;
  }

  return filteredPosts;
}

export function getPainting(params: BaseParams) {
  const { slug, locale } = params;

  const painting = paintings.find(
    (painting) =>
      painting.slug.includes(slug ?? "") &&
      painting.locale === (locale ?? Locale.EN),
  );

  if (!painting) {
    return null;
  }

  return painting;
}

export function getPage(params?: PageParams) {
  const { slug, locale } = params ?? {};

  const page = pages.find((page) => {
    const matchesSlug = slug ? page.slug.includes(slug) : true;
    const matchesLocale = locale ? page.locale === locale : true;
    return matchesSlug && matchesLocale;
  });

  if (!page) {
    return null;
  }

  return page;
}

export function getContent(
  ids?: string[],
  type?: ContentType,
  locale?: Locale,
): ContentWithId<Content> {
  let everything = allDocuments;

  if (type) {
    everything = everything.filter((document) => document.type === type);
  }

  if (locale) {
    everything = everything.filter((document) => document.locale === locale);
  }

  if (!ids || ids.length === 0) {
    return [
      ...everything.map((item) => ({ ...item, _id: item._meta.path })),
    ] as ContentWithId<Content>;
  }

  return [
    ...everything
      .filter((item) => ids.includes(item._meta.path))
      .map((item) => ({ ...item, _id: item._meta.path })),
  ] as ContentWithId<Content>;
}
