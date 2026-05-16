import env from "./env";

export const rateLimitConfig = {
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
} as const;

export default rateLimitConfig;
