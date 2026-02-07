import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { isProduction } from '@/lib/utils';
import { ABUSE_THRESHOLD, ABUSE_WINDOW_SECONDS, TEMP_BLOCK_SECONDS } from '@/lib/constants';

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

// IP-based chat rate limiter -- prevents session-rotation abuse
export const ipChatRateLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(40, '1 m'),
    prefix: 'ratelimit:chat-ip'
});

export async function checkRateLimit(userId: string, type: 'site' | 'chat' | 'stream' = 'chat') {
    const limiter = type === 'site' ? siteRateLimiter : type === 'stream' ? streamRateLimiter : chatRateLimiter;
    const result = await limiter.limit(userId);

    if (!result.success && !isProduction) {
        console.warn(`⚠️ DEV MODE: ${type} rate limit exceeded for ${userId}.`);
    }

    return {
        allowed: result.success,
        warning: !result.success && !isProduction,
        remaining: result.remaining,
        reset: result.reset
    };
}

export async function checkIpRateLimit(ip: string) {
    const result = await ipChatRateLimiter.limit(ip);
    return { allowed: result.success, remaining: result.remaining };
}

export async function isUserBlocked(userId: string): Promise<boolean> {
    const blocked = await kv.get<string>(`blocked:${userId}`);
    return !!blocked;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
    const blocked = await kv.get<string>(`blocked:ip:${ip}`);
    return !!blocked;
}

export async function blockUser(userId: string) {
    await kv.set(`blocked:${userId}`, '1');
}

export async function unblockUser(userId: string) {
    await kv.del(`blocked:${userId}`);
}

// ---------------------------------------------------------------------------
// Abuse escalation
// ---------------------------------------------------------------------------
// Track moderation violations per IP. After ABUSE_THRESHOLD violations within
// the TTL window the IP is temporarily blocked for TEMP_BLOCK_SECONDS.

/**
 * Record a moderation violation for an IP and auto-block if threshold is exceeded.
 * Returns true if the IP was just blocked as a result.
 */
export async function recordAbuseStrike(ip: string): Promise<boolean> {
    try {
        const key = `abuse:strikes:${ip}`;
        const strikes = await kv.incr(key);

        // Set TTL on first strike
        if (strikes === 1) {
            await kv.expire(key, ABUSE_WINDOW_SECONDS);
        }

        if (strikes >= ABUSE_THRESHOLD) {
            // Temp-block the IP
            await kv.set(`blocked:ip:${ip}`, '1', { ex: TEMP_BLOCK_SECONDS });
            await kv.del(key); // reset counter
            if (!isProduction) {
                console.warn(`🚫 IP ${ip} auto-blocked after ${strikes} abuse strikes`);
            }
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error recording abuse strike:', error);
        return false;
    }
}

