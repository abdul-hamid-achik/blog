import { allPages, allPaintings, allPosts, allPrompts } from "content-collections";

// Exclude prompts from document ingestion - they're for AI system prompts, not searchable content
const allDocuments = [...allPosts, ...allPages, ...allPaintings];
import { documents } from "@/db/schema";
import { generateEmbeddings } from "@/lib/ai";
import { db } from "@/lib/db";
import { ContentType } from "@/lib/data";

function createPageContent(doc: any) {
  const fields = [
    { label: 'Type', value: doc.type },
    { label: 'Title', value: doc.title },
    { label: 'Description', value: doc.description },
    ...doc.tags?.map((tag: string) => ({ label: 'Tag', value: tag })) || [],
    { label: 'Body', value: doc.body?.raw }
  ];

  if (doc.type === ContentType.PAINTING) {
    fields.push(
      { label: 'Author', value: doc.author },
      { label: 'Style', value: doc.style },
      { label: 'Country', value: doc.country }
    );
  }

  if (doc.type === ContentType.POST) {
    fields.push(
      { label: 'Date', value: doc.date },
      ...doc.tags?.map((tag: string) => ({ label: 'Tag', value: tag })) || [],
      { label: 'Image', value: doc.image },
      { label: 'SEO', value: doc.seo }
    );
  }

  return fields
    .filter(field => field.value)
    .flatMap(field => [field.label, field.value])
    .join('\n');
}

function constructMetadata({ body, type, ...doc }: any) {
  return { ...doc, _type: type, _raw: body?.raw }
}

async function main() {
  console.log("🚀 Starting ingestion process...");
  console.log("🧹 Clearing documents table...");

  await db.delete(documents);

  console.log("🗺️ Preparing content...");
  console.log(`   Including: ${allPosts.length} posts, ${allPages.length} pages, ${allPaintings.length} paintings`);
  console.log(`   Excluding: ${allPrompts.length} prompts (AI system prompts, not searchable content)`);

  const contents = allDocuments.map((doc) => createPageContent(doc));

  console.log("🤖 Generating embeddings with Vercel AI SDK...");
  console.log(`   Processing ${contents.length} documents...`);

  const embeddings = await generateEmbeddings(contents);

  console.log("💾 Storing in pgvector...");

  await db.insert(documents).values(
    allDocuments.map((doc, i) => ({
      content: contents[i],
      embedding: embeddings[i],
      metadata: constructMetadata(doc)
    }))
  );

  console.log(`✅ Added ${allDocuments.length} documents to vector store with embeddings`)
}


main().catch(error => console.error(error))
  .finally(() => {
    console.log("🏁 Exiting...");
    process.exit();
  });
