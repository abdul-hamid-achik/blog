import { Page, Painting, Post } from ".contentlayer/generated";
import { client } from '@/lib/elastic';
import { createKeyFromJson } from "@/lib/utils";
import fs from 'fs';
// import 'undici';

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

  // @ts-ignore
  const type = dataset[0]?.type?.toLowerCase()

  console.log(`Type of dataset: ${typeof dataset}`);
  console.log(`Injesting: ${type}`)
  console.log(`Number of documents to index: ${dataset.length}`);

  const result = await client.helpers.bulk({
    datasource: dataset,
    pipeline: "ml-inference-inference-search-blog",
    refreshOnCompletion: true,
    onDocument: ({_id, ...doc}: any) => ([
      { index: { _index: 'search-blog' }},
      {...doc, id: createKeyFromJson(doc)}
    ]),
    onDrop (doc) {
      console.log(doc)
    }
  });

  console.log(`Result: ${result}`);

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

  await client.deleteByQuery({
    index: 'search-blog',
    body: {
      query: {
        match_all: {}
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
    ingestContent(allPosts),
    ingestContent(allPages),
    ingestContent(allPaintings),
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
