import { allDocuments, } from ".contentlayer/generated/index.mjs";
import { vectorStore } from "@/lib/ai";


function createPageContent(doc: any) {
  const fields = [doc.title, doc.description, ...(doc.tags || []), doc.body.raw];

  if (doc.type === 'Painting') {
    fields.push(doc.author, doc.style, doc.country);
  }

  return fields.filter(field => field).join('\n');
}

function constructMetadata({body,type, ...doc}: any) {
  return doc
}

async function main() {
  const documents = allDocuments.map(
    (doc) => ({
      pageContent: createPageContent(doc),
      metadata: constructMetadata(doc)
    })
  )

  const contents = documents.map(document => document.pageContent)
  const items = await vectorStore.addDocuments(documents)
  console.log(`Done ${items.length}`)
}

main().catch(error => console.error(error))
  .finally(() => {
    console.log("Exiting...");
    process.exit();
  });
