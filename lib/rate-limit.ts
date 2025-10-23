import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { isProduction } from '@/lib/utils';

// Site-wide rate limiter (for middleware)
export const siteRateLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(25, '10 s'),
    prefix: 'ratelimit:site'
});

// Chat rate limiter (for chat API)
export const chatRateLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'ratelimit:chat'
});

// Streaming chat rate limiter (stricter limits for streaming)
export const streamRateLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // Stricter for streaming
    prefix: 'ratelimit:stream'
});

export async function checkRateLimit(userId: string, type: 'site' | 'chat' | 'stream' = 'chat') {
    const limiter = type === 'site' ? siteRateLimiter : type === 'stream' ? streamRateLimiter : chatRateLimiter;
    const result = await limiter.limit(userId);

    if (!result.success && !isProduction) {
        console.warn(`⚠️ DEV MODE: ${type} rate limit exceeded for ${userId}. Would block in production.`);
        return { allowed: true, warning: true, remaining: 0, reset: result.reset };
    }

    return {
        allowed: result.success,
        warning: false,
        remaining: result.remaining,
        reset: result.reset
    };
}

export async function isUserBlocked(userId: string): Promise<boolean> {
    const blocked = await kv.get<string>(`blocked:${userId}`);
    return !!blocked;
}

export async function blockUser(userId: string) {
    await kv.set(`blocked:${userId}`, '1');
}

export async function unblockUser(userId: string) {
    await kv.del(`blocked:${userId}`);
}

