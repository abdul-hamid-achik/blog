import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  instances: [] as Array<{
    prefix: string;
    policy: { count: number; duration: string };
    limit: ReturnType<typeof vi.fn>;
  }>,
  kv: {
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  slidingWindow: vi.fn((count: number, duration: string) => ({
    count,
    duration,
  })),
}));

vi.mock("@upstash/ratelimit", () => {
  class RatelimitMock {
    static slidingWindow = mocks.slidingWindow;
    prefix: string;
    limit = vi.fn();

    policy: { count: number; duration: string };

    constructor(options: {
      prefix: string;
      limiter: { count: number; duration: string };
    }) {
      this.prefix = options.prefix;
      this.policy = options.limiter;
      mocks.instances.push(this);
    }
  }

  return { Ratelimit: RatelimitMock };
});
vi.mock("@vercel/kv", () => ({ kv: mocks.kv }));

import {
  checkContactRateLimit,
  checkIpRateLimit,
  checkRateLimit,
  isIpBlocked,
  isUserBlocked,
  recordAbuseStrike,
} from "../lib/rate-limit";

function limiter(prefix: string) {
  const instance = mocks.instances.find(
    (candidate) => candidate.prefix === prefix,
  );
  if (!instance) throw new Error(`Missing limiter ${prefix}`);
  return instance.limit;
}

describe("rate limiting and abuse escalation", () => {
  beforeEach(() => {
    for (const instance of mocks.instances) {
      instance.limit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: 123,
      });
    }
  });

  it("constructs dedicated limiters with the intended policies", () => {
    expect(
      mocks.instances.map(({ prefix, policy }) => [prefix, policy]),
    ).toEqual([
      ["ratelimit:site", { count: 25, duration: "10 s" }],
      ["ratelimit:chat", { count: 60, duration: "1 m" }],
      ["ratelimit:stream", { count: 30, duration: "1 m" }],
      ["ratelimit:chat-ip", { count: 40, duration: "1 m" }],
      ["ratelimit:contact", { count: 3, duration: "24 h" }],
    ]);
  });

  it.each([
    ["site", "ratelimit:site"],
    ["chat", "ratelimit:chat"],
    ["stream", "ratelimit:stream"],
  ] as const)("routes %s checks to its own limiter", async (type, prefix) => {
    await expect(checkRateLimit("user-1", type)).resolves.toEqual({
      allowed: true,
      warning: false,
      remaining: 10,
      reset: 123,
    });
    expect(limiter(prefix)).toHaveBeenCalledWith("user-1");
  });

  it("defaults to chat and warns for a development rejection", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    limiter("ratelimit:chat").mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: 456,
    });

    await expect(checkRateLimit("user-2")).resolves.toEqual({
      allowed: false,
      warning: true,
      remaining: 0,
      reset: 456,
    });
    expect(warning).toHaveBeenCalledWith(
      "⚠️ DEV MODE: chat rate limit exceeded for user-2.",
    );
  });

  it("applies the IP limiter and exposes its remaining count", async () => {
    limiter("ratelimit:chat-ip").mockResolvedValueOnce({
      success: false,
      remaining: 2,
    });
    await expect(checkIpRateLimit("127.0.0.1")).resolves.toEqual({
      allowed: false,
      remaining: 2,
    });
  });

  it("applies a separate daily budget to real concierge emails", async () => {
    limiter("ratelimit:contact").mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: 789,
    });

    await expect(checkContactRateLimit("verified-user")).resolves.toEqual({
      allowed: false,
      remaining: 0,
      reset: 789,
    });
    expect(limiter("ratelimit:contact")).toHaveBeenCalledWith("verified-user");
  });

  it("checks user and IP block keys", async () => {
    mocks.kv.get
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce(undefined);

    await expect(isUserBlocked("user-1")).resolves.toBe(true);
    await expect(isUserBlocked("user-2")).resolves.toBe(false);
    await expect(isIpBlocked("10.0.0.1")).resolves.toBe(true);
    await expect(isIpBlocked("10.0.0.2")).resolves.toBe(false);
    expect(mocks.kv.get).toHaveBeenNthCalledWith(1, "blocked:user-1");
    expect(mocks.kv.get).toHaveBeenNthCalledWith(3, "blocked:ip:10.0.0.1");
  });

  it("sets the strike-window TTL only for the first violation", async () => {
    mocks.kv.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(recordAbuseStrike("10.0.0.1")).resolves.toBe(false);
    await expect(recordAbuseStrike("10.0.0.1")).resolves.toBe(false);
    expect(mocks.kv.expire).toHaveBeenCalledTimes(1);
    expect(mocks.kv.expire).toHaveBeenCalledWith("abuse:strikes:10.0.0.1", 600);
    expect(mocks.kv.set).not.toHaveBeenCalled();
  });

  it("temporarily blocks and resets an IP at the abuse threshold", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.kv.incr.mockResolvedValueOnce(5);

    await expect(recordAbuseStrike("10.0.0.9")).resolves.toBe(true);
    expect(mocks.kv.set).toHaveBeenCalledWith("blocked:ip:10.0.0.9", "1", {
      ex: 3600,
    });
    expect(mocks.kv.del).toHaveBeenCalledWith("abuse:strikes:10.0.0.9");
    expect(warning).toHaveBeenCalled();
  });

  it("fails safely when abuse persistence is unavailable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.kv.incr.mockRejectedValueOnce(new Error("KV unavailable"));

    await expect(recordAbuseStrike("10.0.0.8")).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(
      "Error recording abuse strike:",
      expect.any(Error),
    );
  });
});
