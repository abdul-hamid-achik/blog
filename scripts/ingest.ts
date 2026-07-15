import {
  allPages,
  allPaintings,
  allPosts,
  allPrompts,
} from "content-collections";

// Exclude prompts from document ingestion - they're for AI system prompts, not searchable content
const allDocuments = [...allPosts, ...allPages, ...allPaintings];
import { documents } from "@/db/schema";
import { generateEmbeddings } from "@/lib/ai";
import { db } from "@/lib/db";
import { ContentType } from "@/lib/data";

type IngestibleDocument = (typeof allDocuments)[number];
type PaintingDocument = (typeof allPaintings)[number];
type PostDocument = (typeof allPosts)[number];
type IngestLocale = "en" | "es" | "ru";

const INGEST_COPY = {
  en: {
    type: "Type",
    title: "Title",
    description: "Description",
    tag: "Tag",
    body: "Body",
    author: "Author",
    style: "Style",
    country: "Country",
    date: "Date",
    image: "Image",
  },
  es: {
    type: "Tipo",
    title: "Título",
    description: "Descripción",
    tag: "Etiqueta",
    body: "Contenido",
    author: "Autoría",
    style: "Estilo",
    country: "País",
    date: "Fecha",
    image: "Imagen",
  },
  ru: {
    type: "Тип",
    title: "Название",
    description: "Описание",
    tag: "Тег",
    body: "Содержание",
    author: "Автор",
    style: "Стиль",
    country: "Страна",
    date: "Дата",
    image: "Изображение",
  },
} satisfies Record<IngestLocale, Record<string, string>>;

const CONTENT_TYPE_COPY = {
  en: {
    [ContentType.POST]: "Post",
    [ContentType.PAGE]: "Page",
    [ContentType.PAINTING]: "Painting",
    [ContentType.PROMPT]: "Prompt",
  },
  es: {
    [ContentType.POST]: "Ensayo",
    [ContentType.PAGE]: "Página",
    [ContentType.PAINTING]: "Pintura",
    [ContentType.PROMPT]: "Prompt",
  },
  ru: {
    [ContentType.POST]: "Эссе",
    [ContentType.PAGE]: "Страница",
    [ContentType.PAINTING]: "Картина",
    [ContentType.PROMPT]: "Промпт",
  },
} satisfies Record<IngestLocale, Record<ContentType, string>>;

function isPaintingDocument(doc: IngestibleDocument): doc is PaintingDocument {
  return doc.type === ContentType.PAINTING && "author" in doc;
}

function isPostDocument(doc: IngestibleDocument): doc is PostDocument {
  return doc.type === ContentType.POST && "date" in doc;
}

function createPageContent(doc: IngestibleDocument) {
  const locale: IngestLocale =
    doc.locale === "es" || doc.locale === "ru" ? doc.locale : "en";
  const copy = INGEST_COPY[locale];
  const fields = [
    { label: copy.type, value: CONTENT_TYPE_COPY[locale][doc.type] },
    { label: copy.title, value: doc.title },
    { label: copy.description, value: doc.description },
    ...(doc.tags?.map((tag) => ({ label: copy.tag, value: tag })) ?? []),
    { label: copy.body, value: doc.content },
  ];

  if (isPaintingDocument(doc)) {
    fields.push(
      { label: copy.author, value: doc.author },
      { label: copy.style, value: doc.style },
      { label: copy.country, value: doc.country },
    );
  }

  if (isPostDocument(doc)) {
    fields.push(
      { label: copy.date, value: doc.date },
      { label: copy.image, value: doc.image },
    );
  }

  return fields
    .filter((field) => field.value)
    .flatMap((field) => [field.label, String(field.value)])
    .join("\n");
}

function constructMetadata(doc: IngestibleDocument) {
  const metadata: Record<string, unknown> = { ...doc };
  delete metadata.content;
  delete metadata.mdx;
  delete metadata.type;

  return { ...metadata, _type: doc.type, _raw: doc.content };
}

async function main() {
  console.log("🚀 Starting ingestion process...");
  console.log("🧹 Clearing documents table...");

  await db.delete(documents);

  console.log("🗺️ Preparing content...");
  console.log(
    `   Including: ${allPosts.length} posts, ${allPages.length} pages, ${allPaintings.length} paintings`,
  );
  console.log(
    `   Excluding: ${allPrompts.length} prompts (AI system prompts, not searchable content)`,
  );

  const contents = allDocuments.map((doc) => createPageContent(doc));

  console.log("🤖 Generating embeddings with Vercel AI SDK...");
  console.log(`   Processing ${contents.length} documents...`);

  const embeddings = await generateEmbeddings(contents);

  console.log("💾 Storing in pgvector...");

  await db.insert(documents).values(
    allDocuments.map((doc, i) => ({
      content: contents[i],
      embedding: embeddings[i],
      metadata: constructMetadata(doc),
    })),
  );

  console.log(
    `✅ Added ${allDocuments.length} documents to vector store with embeddings`,
  );
}

main()
  .catch((error: unknown) => console.error(error))
  .finally(() => {
    console.log("🏁 Exiting...");
    process.exit();
  });
