import { env } from '@/env.mjs';
import SimpleFM from '@solely/simple-fm';

export const lastfm = new SimpleFM(env.LASTFM_API_KEY);
