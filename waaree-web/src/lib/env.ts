import { z } from "zod";

// Browser-visible config. Validated once, so a missing value fails loudly instead of silently.
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
