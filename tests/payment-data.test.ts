import { describe, expect, it } from "vitest";
import { extractPaymentData } from "@/features/payments/server/mercadopago";

describe("mercadopago payment data", () => {
  it("extracts pix data", () => {
    const data = extractPaymentData({
      id: 123,
      status: "pending",
      point_of_interaction: {
        transaction_data: {
          qr_code: "000201...",
          qr_code_base64: "iVBOR...",
          ticket_url: "https://mp/pix",
        },
      },
    });
    expect(data.id).toBe("123");
    expect(data.status).toBe("pending");
    expect(data.qrCode).toBe("000201...");
    expect(data.qrCodeBase64).toBe("iVBOR...");
    expect(data.ticketUrl).toBe("https://mp/pix");
  });

  it("extracts boleto data", () => {
    const data = extractPaymentData({
      id: "456",
      status: "pending",
      transaction_details: { external_resource_url: "https://mp/boleto" },
      barcode: { content: "23793..." },
    });
    expect(data.ticketUrl).toBe("https://mp/boleto");
    expect(data.barcode).toBe("23793...");
  });
});
