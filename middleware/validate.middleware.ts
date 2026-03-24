import { z } from "zod";

export function validateBody<T extends z.ZodTypeAny>(schema: T, payload: unknown): z.infer<T> {
  return schema.parse(payload);
}
