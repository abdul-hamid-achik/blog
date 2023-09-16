import { Page, Painting, Post } from ".contentlayer/generated";
import { vectorStore } from "@/lib/ai";
import { client } from '@/lib/elastic';
import { createKeyFromJson } from "@/lib/utils";
import fs from 'fs';

type Content = Page[] | Painting[] | Post[]
type Document = Page | Painting | Post

async function ingestContent(dataset: unknown[]) {
  if (!Array.isArray(dataset)) {
    console.debug(dataset)
    console.error('Dataset is not an array');
    return;
  }

  if (!dataset || dataset.length === 0) {
    console.log('Dataset is empty');
    return;
  }

  console.log(`Number of documents to index: ${dataset.length}`);

  const result = await client.helpers.bulk({
    datasource: dataset,
    pipeline: "ml-inference-inference-search-blog",
    refreshOnCompletion: true,
    onDocument: ({ _id, ...doc }: any) => ([
      { index: { _index: 'search-blog' } },
      { ...doc, id: createKeyFromJson(doc), embedding: null }
    ]),
    onDrop(doc) {
      console.log(doc)
    }
  });

  console.log(`Result: ${JSON.stringify(result, null, 2)}`);

  const query = await client.count({ index: 'search-blog' });

  console.log(`Number of documents in index: ${query.count}`);

  const searchResult = await client.search({
    index: 'search-blog',
    q: 'Dostoyevsky'
  });

  console.log(`Found ${searchResult.hits.hits.length} results`)
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

  const data = fs.readFileSync('./dist/dataset.json', 'utf-8') as any

  const {
    posts: allPosts,
    pages: allPages,
    paintings: allPaintings
  } = JSON.parse(data)
  const results = await Promise.allSettled([
    // ingestContent(allPosts),
    // ingestContent(allPages),
    // ingestContent(allPaintings),
    vectorStore.addDocuments([...allPages, ...allPosts, ...allPaintings].map(({body, ...c}) => ({
      pageContent: body.raw,
      metadata: {
        ...c
      }
    })))
  ]);


  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Error in task ${i}:`, result.reason);
    }
  });

  console.log("Done")
}

main().catch(error => console.error(error))
  .finally(() => {
    console.log("Exiting...");
    process.exit();
  });
