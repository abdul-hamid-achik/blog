
import { env } from '@/env.mjs';
import { Client } from '@elastic/elasticsearch';

export const clientOptions = {
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
}

export const client = new Client(clientOptions);


client.diagnostic.on('request', (error, event) => {
  if (error) {
    console.error(`Request error: ${error.message}`);
  } else {
    console.log(`${event?.meta.request.params.method} ${event?.meta.request.params.path}`);
  }
});

client.diagnostic.on('response', (error, event) => {
  if (error) {
    console.error(`Response error: ${error.message}`);
  } else {
    console.log(`${event?.meta.request.params.method} ${event?.meta.request.params.path} ${event?.statusCode}`);
  }
});
