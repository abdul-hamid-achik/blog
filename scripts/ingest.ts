import { allDocuments, } from ".contentlayer/generated/index.mjs";
import { env } from "@/env.mjs";
import { vectorStore } from "@/lib/ai";
import { client } from "@/lib/pinecone";

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

// Function to delay execution
function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

async function main() {
  let indexExists = false;

  // Try to describe the index
  try {
    await client.describeIndex({
      indexName: env.PINECONE_INDEX
    });
    indexExists = true;
  } catch (error) {
    console.error('The index does not exist, it will be created.');
  }

  if (indexExists) {
    try {
      console.log("Deleting index...");
      await client.deleteIndex({
        indexName: env.PINECONE_INDEX
      });

      console.log("Waiting for index deletion to complete...");
      let deletionConfirmed = false;
      let retryCount = 0;

      while (!deletionConfirmed && retryCount < 10) {
        try {
          await client.describeIndex({
            indexName: env.PINECONE_INDEX
          });
          // If the index still exists, wait a bit before retrying
          console.log("Index still exists, waiting and retrying...");
          await delay(1000 * (retryCount + 1)); // wait 1 second more for each retry
          retryCount++;
        } catch (error: any) {
          // If a 404 error is thrown, the index has been deleted
          if (error.status === 404) {
            deletionConfirmed = true;
            console.log("Index deletion confirmed.");
          } else {
            throw error;
          }
        }
      }

      if (!deletionConfirmed) {
        console.error('Failed to confirm index deletion after several attempts.');
      }
    } catch (error) {
      console.error('Error deleting the index.');
    }
  }

  console.log("Creating index...");
  await client.createIndex({
    createRequest: {
      name: env.PINECONE_INDEX,
      dimension: 1536,
      metric: "cosine",
      pods: 1,
      replicas: 1,
      shards: 1
    }
  });

  console.log("Waiting for index to be ready...");
  let index = await client.describeIndex({
    indexName: env.PINECONE_INDEX
  });

  let retryCount = 0;
  let startTime = Date.now();

  while (index.status?.state !== "Ready") {
    let elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Retry count: ${retryCount}, Elapsed time: ${elapsedTime} seconds`);
    await delay(1000 * (retryCount + 1)); // wait 1 second more for each retry
    index = await client.describeIndex({
      indexName: env.PINECONE_INDEX
    });
    retryCount++;
  }

  console.log("Index is ready, waiting a bit more before proceeding...");
  await delay(60_000);
  console.log("Mapping documents...");
  const documents = allDocuments.map(
    (doc) => ({
      pageContent: createPageContent(doc),
      metadata: constructMetadata(doc)
    })
  )
  await delay(60_000);
  console.log("Adding documents to vector store...");
  const items = await vectorStore.addDocuments(documents)
  console.log(`Added ${items.length} documents to vector store`)
}

main().catch(error => console.error(error))
  .finally(() => {
    console.log("Exiting...");
    process.exit();
  });
