import { allDocuments, allPages as pages, allPaintings as paintings, allPosts as posts } from "contentlayer2/generated";


type Paintings = typeof paintings;
type Posts = typeof posts
type Pages = typeof pages;
type Content = typeof allDocuments

export type { Content, Pages, Paintings, Posts };
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

export interface PaintingParams extends BaseParams {
  tag?: string;
  title?: string;
  author?: string;
  year?: number;
  style?: string;
  country?: string;
}

export interface PageParams extends BaseParams { }
export function getPost(params: BaseParams) {
  const { slug, locale } = params;

  const post = posts.find(
    (post) => post.slug.includes(slug ?? "") && post.locale === (locale ?? "en")
  )

  if (!post) {
    return null
  }

  return post
}

export function getPosts(params?: PostParams) {
  const { slug, tag, locale, title, description, date, public: isPublic } = params ?? {};

  const filteredPosts = posts.filter(post => {
    const matchesSlug = slug ? post.slug.includes(slug) : true;
    const matchesTag = tag ? post.tags?.includes(tag) : true;
    const matchesLocale = locale ? post.locale === locale : true;
    const matchesTitle = title ? post.title.includes(title) : true;
    const matchesDescription = description ? post.description?.includes(description) : true;
    const matchesDate = date ? post.date === date : true;
    const matchesPublic = isPublic !== undefined ? post.public === isPublic : post.public === true;
    return matchesSlug && matchesTag && matchesLocale && matchesTitle && matchesDescription && matchesDate && matchesPublic;
  })

  if (filteredPosts.length === 0) {
    return null
  }

  return filteredPosts
}

export function getPainting(params: BaseParams) {
  const { slug, locale } = params;

  const painting = paintings.find(
    (painting) => painting.slug.includes(slug ?? "") && painting.locale === (locale ?? "en")
  )

  if (!painting) {
    return null
  }

  return painting
}

export function getPaintings(params?: PaintingParams) {
  const { slug, tag, locale, title, author, year, style, country } = params ?? {};

  const filteredPaintings = paintings.filter(painting => {
    const matchesSlug = slug ? painting.slug.includes(slug) : true;
    const matchesTag = tag ? painting.tags?.includes(tag) : true;
    const matchesLocale = locale ? painting.locale === locale : true;
    const matchesTitle = title ? painting.title.includes(title) : true;
    const matchesAuthor = author ? painting.author === author : true;
    const matchesYear = year ? painting.year === year : true;
    const matchesStyle = style ? painting.style === style : true;
    const matchesCountry = country ? painting.country === country : true;
    return matchesSlug && matchesTag && matchesLocale && matchesTitle && matchesAuthor && matchesYear && matchesStyle && matchesCountry;
  })

  if (filteredPaintings.length === 0) {
    return null
  }

  return filteredPaintings
}

export function getPage(params?: PageParams) {
  const { slug, locale } = params ?? {};

  const page = pages.find(page => {
    const matchesSlug = slug ? page.slug.includes(slug) : true;
    const matchesLocale = locale ? page.locale === locale : true;
    return matchesSlug && matchesLocale;
  })

  if (!page) {
    return null
  }

  return page
}


export function getContent(ids?: string[], type?: string, locale?: string) {
  let everything = allDocuments;

  if (type) {
    everything = everything.filter(document => document.type === type);
  }

  if (locale) {
    everything = everything.filter(document => document.locale === locale);
  }

  if (!ids || ids.length === 0) {
    return everything;
  }

  return everything.filter(item => ids.includes(item._id));
}

