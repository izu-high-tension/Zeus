import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_PI_SANDBOX: z
    .union([z.literal("true"), z.literal("false")])
    .default("true"),

  PI_API_KEY: z.string().min(1).default("dev-pi-api-key"),
  PI_PLATFORM_API_URL: z.string().url().default("https://api.minepi.com/v2"),

  SESSION_PASSWORD: z
    .string()
    .min(32, "SESSION_PASSWORD must be at least 32 characters")
    .default("dev-only-session-password-please-change-now"),
  SESSION_COOKIE_NAME: z.string().default("pi_animals_session"),

  DATABASE_URL: z.string().default(""),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export const env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PI_SANDBOX: process.env.NEXT_PUBLIC_PI_SANDBOX,
  PI_API_KEY: process.env.PI_API_KEY,
  PI_PLATFORM_API_URL: process.env.PI_PLATFORM_API_URL,
  SESSION_PASSWORD: process.env.SESSION_PASSWORD,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const isSandbox = env.NEXT_PUBLIC_PI_SANDBOX === "true";
