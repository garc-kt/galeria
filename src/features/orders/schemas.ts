import { z } from "zod";
import { emailSchema, uuidSchema } from "@/lib/validation";

export const checkoutSchema = z.object({
  photoId: uuidSchema,
  email: emailSchema,
  name: z.string().trim().max(120).optional(),
  license: z.enum(["personal", "commercial"]).default("personal"),
});
