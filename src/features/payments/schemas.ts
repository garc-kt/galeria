import { z } from "zod";

export const cardPaymentSchema = z.object({
  token: z.string().min(1).max(200),
  payment_method_id: z.string().min(1).max(80),
  installments: z.coerce.number().int().min(1).max(24).optional(),
  issuer_id: z.string().max(80).optional(),
  payer: z.record(z.string(), z.any()).optional(),
});

export const paymentCreateSchema = z.discriminatedUnion("method", [
  z.object({ token: z.string().min(10), method: z.literal("pix") }),
  z.object({
    token: z.string().min(10),
    method: z.literal("boleto"),
    document: z.string().regex(/^\d{11}$/, "CPF inválido."),
  }),
  z.object({ token: z.string().min(10), method: z.literal("card"), card: cardPaymentSchema }),
]);
