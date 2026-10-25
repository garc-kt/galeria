import { siteUrl } from "@/server/env";

export type PaymentMethod = "pix" | "card" | "boleto";

export type CardPaymentData = {
  token?: unknown;
  payment_method_id?: unknown;
  installments?: unknown;
  issuer_id?: unknown;
  payer?: unknown;
};

export type PaymentData = {
  id: string;
  status: string;
  statusDetail?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  barcode?: string;
};

export type CreatePaymentInput = {
  orderId: string;
  photoTitle: string;
  amountCents: number;
  buyerEmail: string;
  buyerName?: string | null;
  method: PaymentMethod;
  card?: CardPaymentData;
  payerDocument?: string;
  idempotencyKey: string;
};

function accessToken(): string {
  const token = (process.env.MP_ACCESS_TOKEN || "").trim();
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado.");
  return token;
}

async function mpFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch("https://api.mercadopago.com" + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + accessToken(),
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(20000),
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function extractPaymentData(raw: Record<string, unknown>): PaymentData {
  const point = asRecord(asRecord(raw.point_of_interaction).transaction_data);
  const details = asRecord(raw.transaction_details);
  const barcode = asRecord(raw.barcode);

  return {
    id: String(raw.id ?? ""),
    status: String(raw.status ?? "pending"),
    statusDetail: raw.status_detail ? String(raw.status_detail) : undefined,
    qrCode: point.qr_code ? String(point.qr_code) : undefined,
    qrCodeBase64: point.qr_code_base64 ? String(point.qr_code_base64) : undefined,
    ticketUrl: point.ticket_url
      ? String(point.ticket_url)
      : details.external_resource_url
        ? String(details.external_resource_url)
        : undefined,
    barcode: barcode.content ? String(barcode.content) : undefined,
  };
}

export async function createPayment(input: CreatePaymentInput): Promise<PaymentData> {
  const body: Record<string, unknown> = {
    transaction_amount: input.amountCents / 100,
    description: input.photoTitle.slice(0, 250),
    external_reference: input.orderId,
    notification_url: siteUrl() + "/api/webhooks/mercadopago",
    statement_descriptor: "GALERIA",
    metadata: {
      order_id: input.orderId,
      method: input.method,
    },
    payer: { email: input.buyerEmail },
  };

  if (input.method === "pix") {
    body.payment_method_id = "pix";
  } else if (input.method === "boleto") {
    body.payment_method_id = "bolbradesco";
  } else {
    const card = input.card ?? {};
    const payer = asRecord(card.payer);
    body.token = card.token;
    body.payment_method_id = card.payment_method_id;
    body.installments = Number(card.installments) || 1;
    if (card.issuer_id) body.issuer_id = card.issuer_id;
    body.payer = { ...payer, email: input.buyerEmail };
    body.capture = true;
    body.binary_mode = false;
  }

  if (input.method !== "card") {
    const parts = (input.buyerName || "").trim().split(/\s+/).filter(Boolean);
    body.payer = {
      ...asRecord(body.payer),
      first_name: parts[0] || "Cliente",
      last_name: parts.slice(1).join(" ") || "Galeria",
    };
  }

  if (input.payerDocument && input.method !== "card") {
    body.payer = {
      ...asRecord(body.payer),
      identification: {
        type: "CPF",
        number: input.payerDocument.replace(/\D/g, ""),
      },
    };
  }

  const response = await mpFetch("/v1/payments", {
    method: "POST",
    headers: { "X-Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = (await response.text()).slice(0, 500);
    let detail = text;
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      detail = String(parsed.message ?? parsed.error ?? text);
    } catch {
      // Keep raw text.
    }
    throw new Error("Mercado Pago: " + detail);
  }

  return extractPaymentData((await response.json()) as Record<string, unknown>);
}

export async function getPayment(paymentId: string): Promise<Record<string, unknown>> {
  const response = await mpFetch("/v1/payments/" + encodeURIComponent(paymentId), { method: "GET" });
  if (!response.ok) throw new Error("Mercado Pago payment lookup failed: " + response.status);
  return (await response.json()) as Record<string, unknown>;
}

export async function refundPayment(paymentId: string): Promise<void> {
  const response = await mpFetch("/v1/payments/" + encodeURIComponent(paymentId) + "/refunds", {
    method: "POST",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error("Mercado Pago refund failed: " + response.status);
  }
}
