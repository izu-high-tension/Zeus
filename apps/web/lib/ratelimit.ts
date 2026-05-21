import { env } from "./env";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface Limiter {
  limit(key: string): Promise<RateLimitResult>;
}

/**
 * In-memory token bucket — used for dev/test when Upstash isn't configured.
 * Process-local; not safe across workers, but fine for tests.
 */
class InMemoryLimiter implements Limiter {
  private buckets = new Map<string, { tokens: number; resetAt: number }>();

  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
  ) {}

  async limit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { tokens: this.capacity - 1, resetAt });
      return { success: true, remaining: this.capacity - 1, resetAt };
    }
    if (bucket.tokens <= 0) {
      return { success: false, remaining: 0, resetAt: bucket.resetAt };
    }
    bucket.tokens -= 1;
    return { success: true, remaining: bucket.tokens, resetAt: bucket.resetAt };
  }
}

function makeLimiter(capacity: number, windowMs: number): Limiter {
  // Lazy: only require @upstash modules at runtime when credentials are set.
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require("@upstash/ratelimit");
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(capacity, `${windowMs} ms`),
      analytics: false,
    });
    return {
      async limit(key: string) {
        const r = await rl.limit(key);
        return {
          success: r.success,
          remaining: r.remaining,
          resetAt: r.reset,
        };
      },
    };
  }
  return new InMemoryLimiter(capacity, windowMs);
}

export const limiters = {
  auth: makeLimiter(10, 60_000),
  paymentIntent: makeLimiter(30, 60_000),
  paymentApprove: makeLimiter(30, 60_000),
  paymentComplete: makeLimiter(30, 60_000),
  mint: makeLimiter(3, 60_000),
};
