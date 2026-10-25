import { z } from "zod";

export const collectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  published: z.boolean().optional(),
});
