
import { env } from '@/env.mjs';
import { Client } from '@elastic/elasticsearch';

export const client = new Client({
  node: env.ELASTICSEARCH_URL,
  auth: {
      username: env.ELASTICSEARCH_USERNAME,
      password: env.ELASTICSEARCH_PASSWORD
  },
  cloud: {
    id: env.ELASTICSEARCH_CLOUD_ID
  },
  maxRetries: 1,
  tls: {
    rejectUnauthorized: false
  },
});


client.diagnostic.on('request', (error, event) => {
  if (error) {
    console.error(`Request error: ${error.message}`);
  } else {
    console.log(`${event?.meta.request.params.method} ${event?.meta.request.params.path}`);
  }
});

// @ts-ignore
client.diagnostic.on('response', (error, {body, ...event}) => {
  if (error) {
    console.error(`Response error: ${error.message}`);
  } else {
    console.error(JSON.stringify(event, null, 2));
  }
});
