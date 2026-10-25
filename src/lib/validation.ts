import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z.string().trim().toLowerCase().max(254).regex(EMAIL_RE, "E-mail inválido.");
export const uuidSchema = z.string().regex(UUID_RE, "Identificador inválido.");
