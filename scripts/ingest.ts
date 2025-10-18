import { allDocuments, } from "contentlayer2/generated";
import { documents } from "@/db/schema";
import { vectorStore } from "@/lib/ai";
import { db } from "@/lib/db";

function createPageContent(doc: any) {
  const fields = [
    { label: 'Type', value: doc.type },
    { label: 'Title', value: doc.title },
    { label: 'Description', value: doc.description },
    ...doc.tags?.map((tag: string) => ({ label: 'Tag', value: tag })) || [],
    { label: 'Body', value: doc.body.raw }
  ];

  if (doc.type === 'Painting') {
    fields.push(
      { label: 'Author', value: doc.author },
      { label: 'Style', value: doc.style },
      { label: 'Country', value: doc.country }
    );
  }

  // Add additional fields that are important for semantic vector usage in Pinecone
  if (doc.type === 'Post') {
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
  return { ...doc, _type: type, _raw: body.raw }
}

async function main() {
  console.log("🚀 Starting ingestion process...");
  console.log("🧹 Clearing documents table...");

  await db.delete(documents);

  console.log("🗺️ Mapping documents...");

  const docs = allDocuments.map(
    (doc) => ({
      id: doc._id,
      pageContent: createPageContent(doc),
      metadata: constructMetadata(doc)
    })
  )

  console.log("💾 Upserting documents...");

  console.log("📚 Adding documents to vector store...");
  await vectorStore.addDocuments(docs);
  console.log(`✅ Added ${docs.length} documents to vector store`)
}


main().catch(error => console.error(error))
  .finally(() => {
    console.log("🏁 Exiting...");
    process.exit();
  });
