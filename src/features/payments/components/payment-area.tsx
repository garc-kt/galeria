"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Barcode, Check, Copy, CreditCard, Loader2, QrCode } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/field";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const CardPayment = dynamic(
  () => import("@mercadopago/sdk-react").then((module) => module.CardPayment),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse border border-line bg-line/20" />,
  },
);

type Method = "pix" | "card" | "boleto";

type PaymentState = {
  id?: string;
  method?: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  barcode?: string;
};

const methods: { id: Method; label: string; hint: string; icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", hint: "Aprovação imediata", icon: QrCode },
  { id: "card", label: "Cartão", hint: "Crédito ou débito", icon: CreditCard },
  { id: "boleto", label: "Boleto", hint: "Vence em 3 dias", icon: Barcode },
];

export function PaymentArea({
  token,
  orderId,
  amountCents,
  email,
  publicKey,
  mock,
}: {
  token: string;
  orderId: string;
  amountCents: number;
  email: string;
  publicKey: string;
  mock: boolean;
}) {
  const [method, setMethod] = useState<Method>("pix");
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [document, setDocument] = useState("");

  function goToSuccess() {
    window.location.assign("/checkout/success?order=" + orderId);
  }

  useEffect(() => {
    if (!publicKey) return;
    let active = true;
    import("@mercadopago/sdk-react")
      .then(({ initMercadoPago }) => {
        if (!active) return;
        initMercadoPago(publicKey, { locale: "pt-BR" });
        setMpReady(true);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o formulário de cartão.");
      });
    return () => {
      active = false;
    };
  }, [publicKey]);

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const response = await fetch("/api/payments/status?token=" + encodeURIComponent(token), {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          status?: string;
          payment?: PaymentState | null;
        };
        if (!active) return;
        if (data.status === "approved") {
          goToSuccess();
          return;
        }
        if (data.payment) setPayment(data.payment);
      } catch {
        // Keep the current UI; the interval retries.
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function create(nextMethod: Method) {
    const digits = document.replace(/\D/g, "");
    if (nextMethod === "boleto" && digits.length !== 11) {
      setError("Informe um CPF válido para gerar o boleto.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          method: nextMethod,
          ...(nextMethod === "boleto" ? { document: digits } : {}),
        }),
      });
      const data = (await response.json()) as {
        status?: string;
        payment?: PaymentState;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o pagamento.");
      if (data.status === "approved") {
        goToSuccess();
        return;
      }
      if (data.payment) setPayment(data.payment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  async function payCard(formData: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, method: "card", card: formData }),
      });
      const data = (await response.json()) as {
        status?: string;
        payment?: PaymentState;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Pagamento recusado. Tente outro cartão.");
      if (data.status === "approved") {
        goToSuccess();
        return;
      }
      if (data.payment) setPayment(data.payment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pagamento recusado. Tente outro cartão.");
    } finally {
      setLoading(false);
    }
  }

  async function mockPay() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as {
        status?: string;
        error?: string;
        downloadToken?: string;
      };
      if (!response.ok) throw new Error(data.error || "Falha no pagamento de teste.");

      if (data.downloadToken) {
        window.location.assign(
          "/checkout/success?order=" + orderId + "&download=" + encodeURIComponent(data.downloadToken),
        );
        return;
      }

      goToSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no pagamento de teste.");
      setLoading(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie o código manualmente.");
    }
  }

  const waiting = payment?.status === "pending" || payment?.status === "in_process";
  const rejected =
    payment?.status === "rejected" || payment?.status === "cancelled" || payment?.status === "failed";

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-line p-5">
        <div>
          <p className="font-display text-3xl tracking-tight">{formatBRL(amountCents)}</p>
        </div>
        <span className="border border-line px-2 py-1 text-xs text-muted">
          BRL
        </span>
      </div>

      <div role="tablist" aria-label="Forma de pagamento" className="grid grid-cols-3 border-b border-line">
        {methods.map((item) => {
          const Icon = item.icon;
          const active = method === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMethod(item.id);
                setError(null);
              }}
              className={cn(
                "flex flex-col items-center gap-1 border-b-2 px-2 py-3 text-xs transition-colors duration-150",
                active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {error ? <p className="mb-4 border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p> : null}

        {mock ? (
          <div>
            <p className="text-sm leading-relaxed text-muted">
              Ambiente de teste. Escolha um método e simule a aprovação para liberar o download.
            </p>
            <div className="mt-4 border border-line p-4">
              <p className="text-sm font-medium">{methods.find((item) => item.id === method)?.label}</p>
              <p className="mt-1 text-xs text-muted">{methods.find((item) => item.id === method)?.hint}</p>
            </div>
            <Button type="button" className="mt-5 w-full" onClick={mockPay} disabled={loading}>
              {loading ? "Processando..." : "Simular pagamento aprovado"}
            </Button>
          </div>
        ) : method === "pix" ? (
          <div>
            {payment?.qrCodeBase64 ? (
              <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
                <img
                  src={"data:image/png;base64," + payment.qrCodeBase64}
                  alt="QR code Pix"
                  width={220}
                  height={220}
                  className="border border-line bg-white p-2"
                />
                <div>
                  <p className="text-sm leading-relaxed text-muted">
                    Escaneie o QR code no app do banco ou copie o código abaixo.
                  </p>
                  <textarea
                    readOnly
                    value={payment.qrCode ?? ""}
                    aria-label="Código Pix copia e cola"
                    className="mt-3 h-24 w-full resize-none border border-line bg-transparent p-2 font-mono text-[10px] text-muted"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copy(payment.qrCode ?? "")}
                      className={buttonClasses("secondary", "sm")}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                      {copied ? "Copiado" : "Copiar código"}
                    </button>
                    {payment.ticketUrl ? (
                      <a
                        href={payment.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted underline underline-offset-4"
                      >
                        Abrir no Mercado Pago
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed text-muted">
                  Gere o QR code e pague no app do seu banco. A confirmação chega em segundos.
                </p>
                <Button type="button" className="mt-5 w-full" onClick={() => create("pix")} disabled={loading}>
                  {loading ? "Gerando..." : "Gerar QR code Pix"}
                </Button>
              </div>
            )}
          </div>
        ) : method === "card" ? (
          <div>
            {!publicKey ? (
              <p className="text-sm leading-relaxed text-muted">
                Pagamento com cartão indisponível: configure <code className="font-mono text-xs">MP_PUBLIC_KEY</code>.
              </p>
            ) : mpReady ? (
              <CardPayment
                initialization={{ amount: amountCents / 100, payer: { email } }}
                locale="pt-BR"
                onSubmit={async (formData) => {
                  await payCard(formData as unknown as Record<string, unknown>);
                }}
                onError={() => setError("Não foi possível carregar o formulário de cartão.")}
              />
            ) : (
              <div className="h-64 animate-pulse border border-line bg-line/20" />
            )}
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Os dados do cartão são tokenizados pelo Mercado Pago e não passam pelo servidor da galeria.
            </p>
          </div>
        ) : (
          <div>
            {payment?.ticketUrl ? (
              <div>
                <p className="text-sm leading-relaxed text-muted">
                  Boleto gerado. Abra o boleto, copie o código ou pague pelo app do banco.
                </p>
                <a
                  href={payment.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClasses("primary", "md", "mt-4 w-full")}
                >
                  Abrir boleto
                </a>
                {payment.barcode ? (
                  <div className="mt-4">
                    <textarea
                      readOnly
                      value={payment.barcode}
                      aria-label="Código de barras do boleto"
                      className="h-20 w-full resize-none border border-line bg-transparent p-2 font-mono text-[10px] text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => copy(payment.barcode ?? "")}
                      className={buttonClasses("secondary", "sm", "mt-2")}
                    >
                      {copied ? "Copiado" : "Copiar código"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <p className="text-sm leading-relaxed text-muted">
                  Gere um boleto bancário. O acesso é liberado após a confirmação do pagamento.
                </p>
                <div className="mt-4">
                  <label htmlFor="boleto-document" className="mb-2 block text-xs text-muted">
                    CPF do pagador
                  </label>
                  <input
                    id="boleto-document"
                    inputMode="numeric"
                    value={document}
                    onChange={(event) => setDocument(event.target.value.replace(/[^\d.-]/g, "").slice(0, 14))}
                    placeholder="000.000.000-00"
                    className={fieldClasses}
                  />
                </div>
                <Button type="button" className="mt-4 w-full" onClick={() => create("boleto")} disabled={loading}>
                  {loading ? "Gerando..." : "Gerar boleto"}
                </Button>
              </div>
            )}
          </div>
        )}

        {waiting && !mock ? (
          <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Aguardando confirmação do pagamento...
          </p>
        ) : null}

        {rejected ? (
          <p className="mt-5 border-t border-line pt-4 text-xs text-red-700">
            Pagamento não aprovado. Tente outro método ou outro cartão.
          </p>
        ) : null}
      </div>

      <div className="border-t border-line p-5 text-[11px] leading-relaxed text-muted">
        Processado pelo Mercado Pago. A galeria não armazena dados de cartão. Em caso de dúvida,
        escreva para o estúdio.
      </div>
    </div>
  );
}
