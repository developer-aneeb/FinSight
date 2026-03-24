import { z } from "zod";
import { HttpError } from "@utils/error";

export function validateBody<T extends z.ZodTypeAny>(schema: T, payload: unknown): z.infer<T> {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    const details = parsed.error.errors.map((entry) => ({
      path: entry.path.join("."),
      message: entry.message,
    }));

    throw new HttpError(400, "Validation failed", details);
  }

  return parsed.data;
}
