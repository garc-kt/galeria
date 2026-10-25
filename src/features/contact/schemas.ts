import { z } from "zod";
import { emailSchema } from "@/lib/validation";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional(),
});
