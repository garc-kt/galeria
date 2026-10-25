import { z } from "zod";
import { emailSchema } from "@/lib/validation";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
});

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Código de 6 dígitos."),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z.string().min(12).max(200),
});
