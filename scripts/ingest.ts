import { Page, Painting, Post } from ".contentlayer/generated";
import { vectorStore } from "@/lib/ai";
import { client } from '@/lib/elastic';
import fs from 'fs';

type Content = Page[] | Painting[] | Post[]
type Document = Page | Painting | Post

function createPageContent(doc: Document) {
  const fields = [doc.title, doc.description, ...(doc.tags || []), doc.body.raw];

  if (doc.type === 'Painting') {
    fields.push(doc.author, doc.style, doc.country);
  }

  return fields.filter(field => field).join('\n');
}

async function main() {
  if (!fs.existsSync('./dist/dataset.json')) {
    throw Error('run export script first');
  }

  const info = await client.info()
  const { name, version, tagline } = info;
  const { number, build_date, lucene_version } = version;

  console.log(`Elasticsearch instance: ${name}`);
  console.log(`Version: ${number}`);
  console.log(`Build date: ${build_date}`);
  console.log(`Lucene version: ${lucene_version}`);
  console.log(`Tagline: ${tagline}`);

  const indexExists = await client.indices.exists({ index: 'search-blog' });
  if (indexExists) {
    await client.indices.delete({ index: 'search-blog' });
  }

  await client.indices.create({
    index: 'search-blog',
    body: {
      settings: {
        index: {
          mapping: {
            total_fields: {
              limit: 5000
            }
          }
        }
      },
      mappings: {
        properties: {
          embedding: {
            type: "dense_vector",
            dims: 1536,
            index: true,
            similarity: "cosine"
          },
        }
      }
    }
  });

  const data = fs.readFileSync('./dist/dataset.json', 'utf-8')
  const content = Object.values(JSON.parse(data)).flat() as Content
  const documents = content.flatMap(
    (doc: Document) => ({
      pageContent: createPageContent(doc),
      metadata: {
        ...doc
      }
    })
  )

  const results = await vectorStore.addDocuments(documents)
  console.log(`Done ${results}`)
}

main().catch(error => console.error(error))
  .finally(() => {
    console.log("Exiting...");
    process.exit();
  });
