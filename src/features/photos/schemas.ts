import { z } from "zod";
import { uuidSchema } from "@/lib/validation";

export const photoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  alt: z.string().trim().min(1).max(300).optional(),
  priceCents: z.number().int().min(0).max(100000000).optional(),
  license: z.enum(["personal", "commercial", "both"]).optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  collectionId: uuidSchema.nullable().optional(),
});
